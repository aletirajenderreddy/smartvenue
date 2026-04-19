import { create } from 'zustand';export const useCrowdStore=create((set)=>({zones:[],setZones:(zones)=>set({zones})}));
