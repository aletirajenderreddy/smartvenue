import { create } from 'zustand';export const useEventStore=create((set)=>({activeEvent:null,setActiveEvent:(activeEvent)=>set({activeEvent})}));
