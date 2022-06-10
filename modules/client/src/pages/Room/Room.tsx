import { type FC } from 'react';
import { useLocation } from 'react-router-dom';
import { Text, VStack, Flex } from '@chakra-ui/react';

import useWebSocketHandlers from '../../hooks/useWebSocketHandlers';
import useUsernameGuard from '../../hooks/useUsernameGuard';
import Canvas from './components/Canvas';
import type RoomLocationState from '../../types/RoomsLocationState';

const Room: FC = () => {
  const { state } = useLocation();

  useUsernameGuard(state as RoomLocationState);

  const { handleSendMessage } = useWebSocketHandlers(
    process.env.WS_URL as string,
  );

  return (
    <VStack spacing={4} height="100%" alignSelf="stretch">
      <Text variant="h1" fontSize="2xl" alignSelf="flex-start">
        Room {(state as RoomLocationState)?.roomName}
      </Text>
      <Flex flexGrow={1} justifyContent="center" alignItems="center">
        <Canvas onSocketMessage={handleSendMessage} />
      </Flex>
    </VStack>
  );
};

export default Room;
