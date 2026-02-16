/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAnalysis from './pages/AIAnalysis';
import AccountDiscipline from './pages/AccountDiscipline';
import Calculator from './pages/Calculator';
import Calendar from './pages/Calendar';
import CoachSam from './pages/CoachSam';
import Discord from './pages/Discord';
import FundedHub from './pages/FundedHub';

import Home from './pages/Home';
import Journal from './pages/Journal';
import Landing from './pages/Landing';
import LearningCompanion from './pages/LearningCompanion';
import LiveChartInsights from './pages/LiveChartInsights';
import MultiTimeframeScan from './pages/MultiTimeframeScan';
import News from './pages/News';
import PaymentCancel from './pages/PaymentCancel';
import PaymentSuccess from './pages/PaymentSuccess';
import Playbook from './pages/Playbook';
import PropDeals from './pages/PropDeals';
import Psychology from './pages/Psychology';
import SessionWorkspace from './pages/SessionWorkspace';
import Settings from './pages/Settings';
import SettingsSubscription from './pages/SettingsSubscription';
import ShareMarketPulse from './pages/ShareMarketPulse';
import Subscribe from './pages/Subscribe';
import TraderJNLIndicator from './pages/TraderJNLIndicator';
import VIPTradeWithFounder from './pages/VIPTradeWithFounder';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAnalysis": AIAnalysis,
    "AccountDiscipline": AccountDiscipline,
    "Calculator": Calculator,
    "Calendar": Calendar,
    "CoachSam": CoachSam,
    "Discord": Discord,
    "FundedHub": FundedHub,

    "Home": Home,
    "Journal": Journal,
    "Landing": Landing,
    "LearningCompanion": LearningCompanion,
    "LiveChartInsights": LiveChartInsights,
    "MultiTimeframeScan": MultiTimeframeScan,
    "News": News,
    "PaymentCancel": PaymentCancel,
    "PaymentSuccess": PaymentSuccess,
    "Playbook": Playbook,
    "PropDeals": PropDeals,
    "Psychology": Psychology,
    "SessionWorkspace": SessionWorkspace,
    "Settings": Settings,
    "SettingsSubscription": SettingsSubscription,
    "ShareMarketPulse": ShareMarketPulse,
    "Subscribe": Subscribe,
    "TraderJNLIndicator": TraderJNLIndicator,
    "VIPTradeWithFounder": VIPTradeWithFounder,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};