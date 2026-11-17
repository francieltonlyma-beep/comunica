import {initializeApp} from 'firebase/app';
import {getFunctions} from 'firebase/functions';
import SurveyRespondent from './SurveyRespondent.jsx';
const app=initializeApp({apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID},'survey-public');
function browserId(){try{let id=localStorage.getItem('comunica-survey-respondent');if(!id){id=crypto.randomUUID();localStorage.setItem('comunica-survey-respondent',id);}return id;}catch{return crypto.randomUUID();}}
const respondentId=browserId();
export default function PublicSurvey(){return <SurveyRespondent functionsClient={getFunctions(app,'us-central1')} token={new URLSearchParams(window.location.search).get('token') || new URLSearchParams(window.location.search).get('pesquisa') || window.location.hash.slice(1)} respondentId={respondentId}/>;}
