import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  View,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  SimpleCell,
  Avatar,
  Text,
  Counter,
  Spinner,
  Div,
  Header,
  Progress,
  Card,
  CardGrid
} from '@vkontakte/vkui';
import {
  Icon28StatisticsOutline,
  Icon28GameOutline,
  Icon28TrophyOutline,
  Icon28FireOutline,
  Icon28ClockOutline,
  Icon28TargetOutline
} from '@vkontakte/icons';

import apiService from '../services/api';

const ProfilePage = ({ user }) => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [statsResponse, historyResponse] = await Promise.all([
        apiService.getUserStats(),
        apiService.getUserGameHistory(1, 10)
      ]);

      if (statsResponse.success) {
        setUserStats(statsResponse.stats);
      }

      if (historyResponse.success) {
        setGameHistory(historyResponse.games);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (achievement) => {
    const achievements = {
      'first_win': '🏆',
      'speed_demon': '⚡',
      'music_expert': '🎵',
      'social_butterfly': '👥',
      'consistency_king': '🔥'
    };
    return achievements[achievement] || '🏅';
  };

  const getAchievementName = (achievement) => {
    const achievements = {
      'first_win': 'Первая победа',
      'speed_demon': 'Скоростной демон',
      'music_expert': 'Знаток музыки',
      'social_butterfly': 'Душа компании',
      'consistency_king': 'Король постоянства'
    };
    return achievements[achievement] || 'Достижение';
  };

  const formatTime = (seconds) => {
    return `${seconds.toFixed(1)}с`;
  };

  const getPositionText = (position, totalPlayers) => {
    if (position === 1) return `🥇 1 место`;
    if (position === 2) return `🥈 2 место`;
    if (position === 3) return `🥉 3 место`;
    return `#${position} из ${totalPlayers}`;
  };

  if (loading) {
    return (
      <View activePanel="profile">
        <Panel id="profile">
          <PanelHeader
            before={<PanelHeaderBack onClick={() => navigate(-1)} />}
          >
            Профиль
          </PanelHeader>
          <Div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spinner size="large" />
          </Div>
        </Panel>
      </View>
    );
  }

  return (
    <View activePanel="profile">
      <Panel id="profile">
        <PanelHeader
          before={<PanelHeaderBack onClick={() => navigate(-1)} />}
        >
          Профиль
        </PanelHeader>

        {/* Основная информация */}
        <Group>
          <Div style={{ textAlign: 'center', padding: '20px' }}>
            <Avatar src={user.photo} size={80} style={{ marginBottom: '16px' }} />
            <Text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              {user.firstName} {user.lastName}
            </Text>
            {userStats && (
              <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                {userStats.totalScore} очков • #{userStats.position || 'N/A'} в рейтинге
              </Text>
            )}
          </Div>
        </Group>

        {/* Статистика */}
        {userStats && (
          <Group header={<Header>Статистика</Header>}>
            <CardGrid size="l">
              <Card style={{ padding: '16px', textAlign: 'center' }}>
                <Icon28GameOutline style={{ marginBottom: '8px', color: 'var(--vkui--color_icon_accent)' }} />
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {userStats.gamesPlayed}
                </Text>
                <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                  Игр сыграно
                </Text>
              </Card>

              <Card style={{ padding: '16px', textAlign: 'center' }}>
                <Icon28TrophyOutline style={{ marginBottom: '8px', color: '#FFD700' }} />
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {userStats.gamesWon}
                </Text>
                <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                  Побед
                </Text>
              </Card>

              <Card style={{ padding: '16px', textAlign: 'center' }}>
                <Icon28TargetOutline style={{ marginBottom: '8px', color: 'var(--vkui--color_icon_accent)' }} />
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {userStats.accuracy}%
                </Text>
                <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                  Точность
                </Text>
              </Card>

              <Card style={{ padding: '16px', textAlign: 'center' }}>
                <Icon28ClockOutline style={{ marginBottom: '8px', color: 'var(--vkui--color_icon_secondary)' }} />
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {formatTime(userStats.averageResponseTime)}
                </Text>
                <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                  Среднее время
                </Text>
              </Card>
            </CardGrid>

            {/* Прогресс бары */}
            <SimpleCell
              before={<Icon28TrophyOutline />}
              after={<Text>{userStats.winRate}%</Text>}
            >
              <div>
                <Text>Процент побед</Text>
                <Progress 
                  value={userStats.winRate} 
                  style={{ marginTop: '8px' }}
                />
              </div>
            </SimpleCell>

            <SimpleCell
              before={<Icon28TargetOutline />}
              after={<Text>{userStats.accuracy}%</Text>}
            >
              <div>
                <Text>Точность ответов</Text>
                <Progress 
                  value={userStats.accuracy} 
                  style={{ marginTop: '8px' }}
                />
              </div>
            </SimpleCell>

            <SimpleCell
              before={<Icon28FireOutline />}
              after={<Counter>{userStats.streak.current}</Counter>}
            >
              <div>
                <Text>Текущая серия побед</Text>
                <Text style={{ color: 'var(--vkui--color_text_secondary)', fontSize: '14px' }}>
                  Лучшая: {userStats.streak.best}
                </Text>
              </div>
            </SimpleCell>
          </Group>
        )}

        {/* Достижения */}
        {userStats && userStats.achievements && userStats.achievements.length > 0 && (
          <Group header={<Header>Достижения</Header>}>
            <CardGrid size="s">
              {userStats.achievements.map((achievement, index) => (
                <Card 
                  key={index}
                  style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    backgroundColor: 'var(--vkui--color_background_accent_themed)'
                  }}
                >
                  <Text style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {getAchievementIcon(achievement)}
                  </Text>
                  <Text style={{ fontSize: '12px', fontWeight: 'medium' }}>
                    {getAchievementName(achievement)}
                  </Text>
                </Card>
              ))}
            </CardGrid>
          </Group>
        )}

        {/* История игр */}
        {gameHistory.length > 0 && (
          <Group header={<Header>Последние игры</Header>}>
            {gameHistory.slice(0, 5).map((game, index) => (
              <SimpleCell
                key={game.id}
                before={
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%',
                    backgroundColor: game.playerPosition === 1 ? '#4BB34B' : 
                                   game.playerPosition <= 3 ? '#FF9500' : 
                                   'var(--vkui--color_background_secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: game.playerPosition <= 3 ? 'white' : 'var(--vkui--color_text_primary)'
                  }}>
                    {game.playerPosition === 1 ? '🏆' : `#${game.playerPosition}`}
                  </div>
                }
                after={<Text style={{ color: 'var(--vkui--color_text_accent)' }}>+{game.playerScore}</Text>}
                multiline
              >
                <div>
                  <Text weight="medium">
                    {getPositionText(game.playerPosition, game.totalPlayers)}
                  </Text>
                  <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                    {new Date(game.finishedAt).toLocaleDateString()} • 
                    {game.roundsCount} раундов • 
                    {game.settings.difficulty}
                  </Text>
                </div>
              </SimpleCell>
            ))}
            
            {gameHistory.length > 5 && (
              <SimpleCell
                onClick={() => navigate('/history')}
                style={{ color: 'var(--vkui--color_text_accent)' }}
              >
                Показать всю историю
              </SimpleCell>
            )}
          </Group>
        )}

        {/* Пустое состояние */}
        {userStats && userStats.gamesPlayed === 0 && (
          <Group>
            <Div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Icon28StatisticsOutline 
                style={{ 
                  marginBottom: '16px',
                  color: 'var(--vkui--color_icon_secondary)',
                  fontSize: '48px'
                }} 
              />
              <Text style={{ 
                marginBottom: '8px',
                fontSize: '18px',
                fontWeight: 'medium'
              }}>
                Пора начать играть!
              </Text>
              <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                Сыграйте свою первую игру, чтобы увидеть статистику
              </Text>
            </Div>
          </Group>
        )}
      </Panel>
    </View>
  );
};

export default ProfilePage;