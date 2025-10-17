import React from 'react';
import LoginPage from './LoginPage';

const LoginWrapper = () => {
  // These functions can be dummy functions as they are used for switching between modals,
  // which is not the primary concern here.
  const handleClose = () => {};
  const handleSwitchToSignUp = () => {};
  const handleSwitchToForgotPassword = () => {};

  return (
    <LoginPage
      isOpen={true}
      onClose={handleClose}
      onSwitchToSignUp={handleSwitchToSignUp}
      onSwitchToForgotPassword={handleSwitchToForgotPassword}
    />
  );
};

export default LoginWrapper;
