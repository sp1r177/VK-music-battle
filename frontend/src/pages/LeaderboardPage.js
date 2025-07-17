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
  Header
} from '@vkontakte/vkui';
import { Icon28CrownOutline } from '@vkontakte/icons';

import apiService from '../services/api';

const LeaderboardPage = ({ user }) => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLeaderboard(50);
      if (response.success) {
        setLeaderboard(response.leaderboard);
        
        // Найти позицию текущего пользователя
        const currentUserEntry = response.leaderboard.find(
          entry => entry.user.id === user.id
        );
        if (currentUserEntry) {
          setUserPosition(currentUserEntry.position);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  const getRankColor = (position) => {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    return 'var(--vkui--color_text_primary)';
  };

  if (loading) {
    return (
      <View activePanel="leaderboard">
        <Panel id="leaderboard">
          <PanelHeader
            before={<PanelHeaderBack onClick={() => navigate(-1)} />}
          >
            Лидерборд
          </PanelHeader>
          <Div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spinner size="large" />
          </Div>
        </Panel>
      </View>
    );
  }

  return (
    <View activePanel="leaderboard">
      <Panel id="leaderboard">
        <PanelHeader
          before={<PanelHeaderBack onClick={() => navigate(-1)} />}
        >
          Лидерборд
        </PanelHeader>

        {userPosition && userPosition > 10 && (
          <Group header={<Header>Ваша позиция</Header>}>
            <SimpleCell
              before={
                <div style={{ display: 'flex', alignItems: 'center', minWidth: '40px' }}>
                  <Text style={{ color: getRankColor(userPosition), fontWeight: 'bold' }}>
                    #{userPosition}
                  </Text>
                </div>
              }
              after={
                <Text weight="medium" style={{ color: 'var(--vkui--color_text_accent)' }}>
                  {user.totalScore || 0}
                </Text>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={user.photo} size={40} style={{ marginRight: '12px' }} />
                <div>
                  <Text weight="medium">{user.firstName} {user.lastName}</Text>
                  <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                    {user.gamesPlayed || 0} игр • {user.winRate || 0}% побед
                  </Text>
                </div>
              </div>
            </SimpleCell>
          </Group>
        )}

        <Group header={<Header>Топ игроков</Header>}>
          {leaderboard.length === 0 ? (
            <Div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                Пока никто не играл
              </Text>
            </Div>
          ) : (
            leaderboard.map((entry, index) => (
              <SimpleCell
                key={entry.user.id}
                before={
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: '60px' }}>
                    {entry.position <= 3 && (
                      <Icon28CrownOutline 
                        style={{ 
                          color: getRankColor(entry.position),
                          marginRight: '8px',
                          display: entry.position === 1 ? 'block' : 'none'
                        }} 
                      />
                    )}
                    <Text style={{ 
                      color: getRankColor(entry.position), 
                      fontWeight: entry.position <= 3 ? 'bold' : 'normal',
                      fontSize: entry.position <= 3 ? '18px' : '16px'
                    }}>
                      {getRankIcon(entry.position) || `#${entry.position}`}
                    </Text>
                  </div>
                }
                after={
                  <div style={{ textAlign: 'right' }}>
                    <Text weight="medium" style={{ 
                      color: entry.position <= 3 ? getRankColor(entry.position) : 'var(--vkui--color_text_accent)',
                      fontSize: entry.position <= 3 ? '16px' : '14px'
                    }}>
                      {entry.stats.totalScore}
                    </Text>
                    {entry.stats.streak > 0 && (
                      <Text style={{ 
                        color: 'var(--vkui--color_text_secondary)',
                        fontSize: '12px'
                      }}>
                        🔥 {entry.stats.streak}
                      </Text>
                    )}
                  </div>
                }
                style={{
                  backgroundColor: entry.user.id === user.id ? 'var(--vkui--color_background_accent_themed)' : 'transparent',
                  borderRadius: entry.user.id === user.id ? '8px' : '0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={entry.user.photo} 
                    size={entry.position <= 3 ? 48 : 40} 
                    style={{ marginRight: '12px' }} 
                  />
                  <div>
                    <Text weight={entry.position <= 3 ? 'medium' : 'regular'}>
                      {entry.user.firstName} {entry.user.lastName}
                      {entry.user.id === user.id && (
                        <Text style={{ color: 'var(--vkui--color_text_accent)', marginLeft: '8px' }}>
                          (Вы)
                        </Text>
                      )}
                    </Text>
                    <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                      {entry.stats.gamesPlayed} игр • {entry.stats.winRate}% побед
                      {entry.stats.streak > 1 && (
                        <span style={{ color: 'var(--vkui--color_text_accent)' }}>
                          {' '}• Серия: {entry.stats.streak}
                        </span>
                      )}
                    </Text>
                  </div>
                </div>
              </SimpleCell>
            ))
          )}
        </Group>

        {leaderboard.length > 0 && (
          <Div style={{ 
            textAlign: 'center', 
            padding: '20px',
            color: 'var(--vkui--color_text_secondary)',
            fontSize: '14px'
          }}>
            Рейтинг обновляется в реальном времени
          </Div>
        )}
      </Panel>
    </View>
  );
};

export default LeaderboardPage;