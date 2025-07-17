import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  View,
  Panel,
  PanelHeader,
  Group,
  Cell,
  Button,
  Avatar,
  Div,
  Card,
  Text,
  Headline,
  Subhead,
  Counter,
  Spinner,
  SimpleCell,
  Header,
  CardGrid,
  ContentCard,
  ModalRoot,
  ModalPage,
  ModalPageHeader,
  PanelHeaderButton,
  FormLayout,
  FormItem,
  Input,
  Select,
  Checkbox
} from '@vkontakte/vkui';
import {
  Icon28Users3Outline,
  Icon28MusicOutline,
  Icon28CrownOutline,
  Icon28UserCircleOutline,
  Icon28AddOutline,
  Icon28PlayCircleOutline,
  Icon24Cancel,
  Icon24Done,
  Icon28ShareOutline
} from '@vkontakte/icons';

import apiService from '../services/api';
import vkBridge from '../services/vkBridge';

const HomePage = ({ user }) => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createRoomForm, setCreateRoomForm] = useState({
    name: '',
    maxPlayers: 6,
    roundsCount: 5,
    roundTime: 30,
    difficulty: 'medium',
    isPrivate: false
  });
  const [joinRoomCode, setJoinRoomCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsResponse, leaderboardResponse, statsResponse] = await Promise.all([
        apiService.getPublicRooms(1, 5),
        apiService.getLeaderboard(5),
        apiService.getUserStats()
      ]);

      if (roomsResponse.success) {
        setPublicRooms(roomsResponse.rooms);
      }

      if (leaderboardResponse.success) {
        setLeaderboard(leaderboardResponse.leaderboard);
      }

      if (statsResponse.success) {
        setUserStats(statsResponse.stats);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await apiService.createRoom(createRoomForm.name, {
        maxPlayers: createRoomForm.maxPlayers,
        roundsCount: createRoomForm.roundsCount,
        roundTime: createRoomForm.roundTime,
        difficulty: createRoomForm.difficulty,
        isPrivate: createRoomForm.isPrivate
      });

      if (response.success) {
        setActiveModal(null);
        navigate(`/room/${response.room.id}`);
        
        // Поделиться комнатой если не приватная
        if (!createRoomForm.isPrivate) {
          setTimeout(() => {
            vkBridge.shareLink(
              response.room.inviteLink,
              `Присоединяйся к музыкальному баттлу "${response.room.name}"!`
            );
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      // TODO: показать ошибку пользователю
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomCode.trim()) return;

    try {
      const response = await apiService.joinRoom(joinRoomCode.toUpperCase());
      if (response.success) {
        setActiveModal(null);
        navigate(`/room/${response.room.id}`);
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      // TODO: показать ошибку пользователю
    }
  };

  const handleJoinPublicRoom = async (roomId) => {
    try {
      // Находим комнату по ID и используем её код
      const room = publicRooms.find(r => r.id === roomId);
      if (room) {
        const response = await apiService.joinRoom(room.code);
        if (response.success) {
          navigate(`/room/${response.room.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to join public room:', error);
    }
  };

  const createRoomModal = (
    <ModalPage
      id="create-room"
      header={
        <ModalPageHeader
          before={
            <PanelHeaderButton onClick={() => setActiveModal(null)}>
              <Icon24Cancel />
            </PanelHeaderButton>
          }
          after={
            <PanelHeaderButton onClick={handleCreateRoom}>
              <Icon24Done />
            </PanelHeaderButton>
          }
        >
          Создать комнату
        </ModalPageHeader>
      }
    >
      <FormLayout>
        <FormItem top="Название комнаты">
          <Input
            placeholder="Введите название"
            value={createRoomForm.name}
            onChange={(e) => setCreateRoomForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </FormItem>
        
        <FormItem top="Максимум игроков">
          <Select
            value={createRoomForm.maxPlayers}
            onChange={(e) => setCreateRoomForm(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num} игроков</option>
            ))}
          </Select>
        </FormItem>
        
        <FormItem top="Количество раундов">
          <Select
            value={createRoomForm.roundsCount}
            onChange={(e) => setCreateRoomForm(prev => ({ ...prev, roundsCount: parseInt(e.target.value) }))}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num} раундов</option>
            ))}
          </Select>
        </FormItem>
        
        <FormItem top="Время на ответ (секунды)">
          <Select
            value={createRoomForm.roundTime}
            onChange={(e) => setCreateRoomForm(prev => ({ ...prev, roundTime: parseInt(e.target.value) }))}
          >
            {[15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(num => (
              <option key={num} value={num}>{num} секунд</option>
            ))}
          </Select>
        </FormItem>
        
        <FormItem top="Сложность">
          <Select
            value={createRoomForm.difficulty}
            onChange={(e) => setCreateRoomForm(prev => ({ ...prev, difficulty: e.target.value }))}
          >
            <option value="easy">Легкая</option>
            <option value="medium">Средняя</option>
            <option value="hard">Сложная</option>
          </Select>
        </FormItem>
        
        <FormItem>
          <Checkbox
            checked={createRoomForm.isPrivate}
            onChange={(e) => setCreateRoomForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
          >
            Приватная комната
          </Checkbox>
        </FormItem>
      </FormLayout>
    </ModalPage>
  );

  const joinRoomModal = (
    <ModalPage
      id="join-room"
      header={
        <ModalPageHeader
          before={
            <PanelHeaderButton onClick={() => setActiveModal(null)}>
              <Icon24Cancel />
            </PanelHeaderButton>
          }
          after={
            <PanelHeaderButton onClick={handleJoinRoom}>
              <Icon24Done />
            </PanelHeaderButton>
          }
        >
          Присоединиться
        </ModalPageHeader>
      }
    >
      <FormLayout>
        <FormItem 
          top="Код комнаты"
          status={joinRoomCode.length > 0 && joinRoomCode.length !== 6 ? 'error' : 'default'}
          bottom={joinRoomCode.length > 0 && joinRoomCode.length !== 6 ? 'Код должен содержать 6 символов' : ''}
        >
          <Input
            placeholder="Введите код"
            value={joinRoomCode}
            onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
        </FormItem>
      </FormLayout>
    </ModalPage>
  );

  const modal = (
    <ModalRoot activeModal={activeModal} onClose={() => setActiveModal(null)}>
      {createRoomModal}
      {joinRoomModal}
    </ModalRoot>
  );

  if (loading) {
    return (
      <View activePanel="home">
        <Panel id="home">
          <PanelHeader>VK Музыкальный Баттл</PanelHeader>
          <Div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spinner size="large" />
          </Div>
        </Panel>
      </View>
    );
  }

  return (
    <View activePanel="home" modal={modal}>
      <Panel id="home">
        <PanelHeader>VK Музыкальный Баттл</PanelHeader>
        
        {/* Профиль пользователя */}
        <Group>
          <SimpleCell
            before={<Avatar src={user.photo} size={48} />}
            after={<Icon28UserCircleOutline />}
            onClick={() => navigate('/profile')}
            multiline
          >
            <div>
              <Text weight="medium">{user.firstName} {user.lastName}</Text>
              <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                Очки: {userStats?.totalScore || 0} • 
                Игр: {userStats?.gamesPlayed || 0} • 
                Побед: {userStats?.gamesWon || 0}
              </Text>
            </div>
          </SimpleCell>
        </Group>

        {/* Действия */}
        <Group header={<Header>Игра</Header>}>
          <CardGrid size="l">
            <ContentCard
              onClick={() => setActiveModal('create-room')}
              header="Создать комнату"
              subtitle="Пригласи друзей и начни баттл"
              style={{ backgroundColor: 'var(--vkui--color_background_accent)' }}
              caption={
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                  <Icon28AddOutline style={{ marginRight: '8px' }} />
                  <Text style={{ color: 'white' }}>Создать</Text>
                </div>
              }
            />
            
            <ContentCard
              onClick={() => setActiveModal('join-room')}
              header="Присоединиться"
              subtitle="Введи код комнаты"
              caption={
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                  <Icon28Users3Outline style={{ marginRight: '8px' }} />
                  <Text>По коду</Text>
                </div>
              }
            />
          </CardGrid>
        </Group>

        {/* Публичные комнаты */}
        {publicRooms.length > 0 && (
          <Group header={<Header>Открытые комнаты</Header>}>
            {publicRooms.map(room => (
              <SimpleCell
                key={room.id}
                before={<Icon28PlayCircleOutline />}
                after={<Counter>{room.playersCount}/{room.maxPlayers}</Counter>}
                onClick={() => handleJoinPublicRoom(room.id)}
                multiline
              >
                <div>
                  <Text weight="medium">{room.name}</Text>
                  <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                    {room.host.firstName} • {room.settings.roundsCount} раундов • {room.settings.difficulty}
                  </Text>
                </div>
              </SimpleCell>
            ))}
            
            <SimpleCell
              onClick={() => navigate('/rooms')}
              style={{ color: 'var(--vkui--color_text_accent)' }}
            >
              Показать все комнаты
            </SimpleCell>
          </Group>
        )}

        {/* Мини-лидерборд */}
        {leaderboard.length > 0 && (
          <Group header={<Header>Лидеры</Header>}>
            {leaderboard.slice(0, 3).map((entry, index) => (
              <SimpleCell
                key={entry.user.id}
                before={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {index === 0 && <Icon28CrownOutline style={{ color: '#FFD700', marginRight: '8px' }} />}
                    <Avatar src={entry.user.photo} size={40} />
                  </div>
                }
                after={<Text weight="medium">{entry.stats.totalScore}</Text>}
              >
                <div>
                  <Text weight="medium">{entry.user.firstName} {entry.user.lastName}</Text>
                  <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                    {entry.stats.gamesPlayed} игр • {entry.stats.winRate}% побед
                  </Text>
                </div>
              </SimpleCell>
            ))}
            
            <SimpleCell
              onClick={() => navigate('/leaderboard')}
              style={{ color: 'var(--vkui--color_text_accent)' }}
            >
              Полный рейтинг
            </SimpleCell>
          </Group>
        )}

        {/* Навигация */}
        <Group>
          <SimpleCell
            before={<Icon28MusicOutline />}
            onClick={() => navigate('/history')}
          >
            История игр
          </SimpleCell>
          
          <SimpleCell
            before={<Icon28ShareOutline />}
            onClick={() => vkBridge.shareLink(
              window.location.origin,
              'Попробуй угадать песни в VK Музыкальном Баттле!'
            )}
          >
            Поделиться приложением
          </SimpleCell>
        </Group>
      </Panel>
    </View>
  );
};

export default HomePage;