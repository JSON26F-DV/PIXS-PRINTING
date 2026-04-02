import React from 'react';
import Login from '../../views/auth/Login';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'signin' | 'signup';
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return <Login isOpen={isOpen} onClose={onClose} />;
};

export default AuthModal;
