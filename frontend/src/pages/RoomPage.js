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

const RoomPage = ({ user }) => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  return (
    <View activePanel="room">
      <Panel id="room">
        <PanelHeader
          before={<PanelHeaderBack onClick={() => navigate(-1)} />}
        >
          Комната
        </PanelHeader>
        
        <Div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Text>Страница комнаты {roomId}</Text>
          <Text style={{ color: 'var(--vkui--color_text_secondary)', marginTop: '16px' }}>
            Эта страница будет содержать интерфейс комнаты ожидания игры
          </Text>
        </Div>
      </Panel>
    </View>
  );
};

export default RoomPage;