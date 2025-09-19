export type EmergencyType = 
  | 'missile_attack'
  | 'drone_attack' 
  | 'flood'
  | 'wildfire'
  | 'shooting'
  | 'earthquake'
  | 'chemical_emergency'
  | 'biological_emergency';

export interface EmergencyData {
  type: EmergencyType;
  title: string;
  description: string;
  instructions: string[];
  shouldEvacuate: boolean;
  shelterType?: 'missile_shelter' | 'evacuation_center' | 'high_ground' | 'indoor_safe_room';
  priority: 'critical' | 'high' | 'medium';
  icon: string;
}

export interface EmergencyLocation {
  lat: number;
  lng: number;
  name: string;
  type: 'shelter' | 'hospital' | 'evacuation_center' | 'safe_zone';
  distance?: number;
}

export interface ActiveEmergency {
  type: EmergencyType;
  location?: EmergencyLocation;
  isActive: boolean;
  timestamp: Date;
}

export interface LearningContent {
  id: string;
  emergencyType: EmergencyType;
  title: string;
  description: string;
  content: string;
  tips: string[];
  preparationSteps: string[];
  warningSigns: string[];
}
