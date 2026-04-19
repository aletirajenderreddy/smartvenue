import { useEffect } from 'react';import { setupFCM } from '../services/analytics.service';export default function useNotifications(uid){useEffect(()=>{if(uid) setupFCM(uid);},[uid]);}
