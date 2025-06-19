import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { environment } from "src/environments/environment";

// Initialize Firebase app
const firebaseApp = initializeApp(environment.firebaseConfig);

// Export the messaging instance
export const messaging = getMessaging(firebaseApp);