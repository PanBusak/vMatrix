import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

const MainPage = () => {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Navbrar
          </Typography>
          
          <Button color="inherit" component={Link} to="/main/dash">
            Dash Board
          </Button>
          <Link to="/main/dash">Linkcok</Link>
          <Button color="inherit" component={Link} to="/main/cronJobs">
            Pes
          </Button>
        </Toolbar>
      </AppBar>

    
        <Outlet /> 
      
    </div>
  );
};

export default MainPage;
