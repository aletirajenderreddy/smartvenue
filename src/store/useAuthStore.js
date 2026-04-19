import { create } from 'zustand';export const useAuthStore=create((set)=>({user:null,profile:null,setAuth:(user,profile)=>set({user,profile})}));
