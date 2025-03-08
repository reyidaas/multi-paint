import { type FC, useEffect } from 'react';
import { Box, Link, Tooltip, useColorMode } from '@chakra-ui/react';
import { GitHub } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';

const App: FC = () => {
  const { setColorMode } = useColorMode();

  useEffect(() => {
    setColorMode('dark');
  }, []);

  return (
    <Box px={16} py={12} height="100vh" position="relative">
      <Outlet />
      <Tooltip label="GitHub">
        <Link
          position="absolute"
          top={5}
          right={5}
          href="https://github.com/reyidaas/multi-paint"
          target="_blank"
          color="gray.500"
        >
          <GitHub color="inherit" />
        </Link>
      </Tooltip>
    </Box>
  );
};

export default App;
