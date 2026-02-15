import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalContextType {
    isLoginModalOpen: boolean;
    isSignUpModalOpen: boolean;
    isForgotPasswordModalOpen: boolean;
    openLoginModal: () => void;
    openSignUpModal: () => void;
    openForgotPasswordModal: () => void;
    closeAllModals: () => void;
    switchToSignUp: () => void;
    switchToLogin: () => void;
    switchToForgotPassword: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

    const closeAllModals = useCallback(() => {
        setIsLoginModalOpen(false);
        setIsSignUpModalOpen(false);
        setIsForgotPasswordModalOpen(false);
    }, []);

    const openLoginModal = useCallback(() => {
        closeAllModals();
        setIsLoginModalOpen(true);
    }, [closeAllModals]);

    const openSignUpModal = useCallback(() => {
        closeAllModals();
        setIsSignUpModalOpen(true);
    }, [closeAllModals]);

    const openForgotPasswordModal = useCallback(() => {
        closeAllModals();
        setIsForgotPasswordModalOpen(true);
    }, [closeAllModals]);

    const switchToSignUp = useCallback(() => {
        setIsLoginModalOpen(false);
        setIsSignUpModalOpen(true);
    }, []);

    const switchToLogin = useCallback(() => {
        setIsSignUpModalOpen(false);
        setIsForgotPasswordModalOpen(false);
        setIsLoginModalOpen(true);
    }, []);

    const switchToForgotPassword = useCallback(() => {
        setIsLoginModalOpen(false);
        setIsForgotPasswordModalOpen(true);
    }, []);

    return (
        <ModalContext.Provider value={{
            isLoginModalOpen,
            isSignUpModalOpen,
            isForgotPasswordModalOpen,
            openLoginModal,
            openSignUpModal,
            openForgotPasswordModal,
            closeAllModals,
            switchToSignUp,
            switchToLogin,
            switchToForgotPassword,
        }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export default ModalContext;
