import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  View,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Div,
  Text
} from '@vkontakte/vkui';

const GamePage = ({ user }) => {
  const navigate = useNavigate();
  const { gameId } = useParams();

  return (
    <View activePanel="game">
      <Panel id="game">
        <PanelHeader
          before={<PanelHeaderBack onClick={() => navigate(-1)} />}
        >
          Игра
        </PanelHeader>
        
        <Div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Text>Страница игры {gameId}</Text>
          <Text style={{ color: 'var(--vkui--color_text_secondary)', marginTop: '16px' }}>
            Эта страница будет содержать интерфейс самой игры с музыкой и ответами
          </Text>
        </Div>
      </Panel>
    </View>
  );
};

export default GamePage;