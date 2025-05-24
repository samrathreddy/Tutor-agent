import { v4 as uuidv4 } from 'uuid';

const SESSION_USER_ID = 'tutor_agent_user_id';

export const getUserId = () => {
    let userId = localStorage.getItem(SESSION_USER_ID);
    
    if (!userId) {
        // Generate a new UUID if no user ID exists
        userId = uuidv4();
        localStorage.setItem(SESSION_USER_ID, userId);
    }
    
    return userId;
};

export const clearSession = () => {
    localStorage.removeItem(SESSION_USER_ID);
}; 