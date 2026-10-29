Warning: truncated output (original token count: 253469)
Total output lines: 11502

import { assertSchedulePublicationSize } from './schedulePublicationLimits.js';
import { auditScheduleConfiguration, suggestCompatibleScheduleRules } from './scheduleConfigurationAudit.js';
import ScheduleShiftEditor from './ScheduleShiftEditor.jsx';
import { normalizeScheduleShifts, validateScheduleShifts } from './scheduleShifts.js';
import { CoverageRequirementEditor } from './ScheduleCoveragePanel.jsx';
import { scopedScheduleSource } from './scheduleScope.js';
import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
const ScheduleConfigurationAudit = lazy(() => import('./ScheduleConfigurationAudit.jsx'));
import { isCompanyEmployee } from './teamMembership';
import { loginErrorMessage } from './loginError';
import { isLoginCompanyIdentified } from './loginCompany';
import { commitAtomicRecords } from './atomicRecords';
import { eventAnnouncementTitle, eventAnnouncementContent, linkedEventAnnouncementIds } from './calendarEventLinks';
import { PLATFORM_SUPPORT, withPlatformSupport } from './platformSupportContact';
import { DEFAULT_DOCUMENT_FOLDER, normalizeDocumentFolder, documentFileType, documentFolders, documentReviewStatus, filterDocuments, canAccessDocument } from './documentOrganization';
import { pollVoteCount, pollParticipation, pollOptionResults, pollFormCompletion, normalizePollQuestions, pollTimelineItems } from './pollInsights';
const FeatureTutorial = lazy(() => import('./FeatureTutorial.jsx'));
const ScheduleRuleEditor = lazy(() => import('./ScheduleRuleEditor.jsx'));
const ScheduleCalendar = lazy(() => import('./ScheduleCalendar.jsx'));
const ScheduleOptimizationSummary = lazy(() => import('./ScheduleOptimizationSummary.jsx'));
const ScheduleProposalCalendar = lazy(() => import('./ScheduleProposalCalendar.jsx'));
const ScheduleDayEditor = lazy(() => import('./ScheduleDayEditor.jsx'));
const ScheduleHolidayPlanner = lazy(() => import('./ScheduleHolidayPlanner.jsx'));
const ScheduleDraftBar = lazy(() => import('./ScheduleDraftBar.jsx'));
import { scheduleDraftHash, validateScheduleDraftScope } from './scheduleDrafts.js';
import { scheduleStatusChange } from './scheduleStatusChange.js';
import { scheduleIssueTarget, scheduleRowFieldIssues } from './scheduleValidation.js';
import { schedulePublicationError } from './schedulePublicationErrors.js';
const PublishedScheduleEditor = lazy(() => import('./PublishedScheduleEditor.jsx'));
const PublishedScheduleSwap = lazy(() => import('./PublishedScheduleSwap.jsx'));
import { canEditPublishedSchedule, planPublishedDayEdit } from './publishedScheduleEdit.js';
import { planPublishedScheduleSwap } from './publishedScheduleSwap.js';
import { buildScheduleSwapRequest, resolveScheduleSwapRequest, swapRequestPatch } from './scheduleSwapRequests.js';
import { buildCoverageFirstProposal, balancePreparedScheduleProposal, analyzeProposalCoverage, isFixedProposalRow, isProtectedProposalRow, optimizeScheduleCoverage, planSchedulePublication, prepareScheduleProposal, scheduleSignature } from './scheduleOptimizer.js';
import { scheduleDepartmentForEmployee, scheduleRecordInScope, scheduleScopeForUser } from './scheduleScope.js';
import { normalizeCoverageRequirements, validateCoverageRequirements } from './scheduleCoverage.js';
import { newDayRule, normalizeRuleGroups, validateRuleGroups, buildRuleSchedule, scheduleRuleIssues, validateHolidayAssignments, holidayWorkTemplate, previousScheduleForDate } from './scheduleDayRules';
const WhistleblowingAdmin = lazy(() => import('./WhistleblowingAdmin.jsx'));
const PlatformUpdates = lazy(() => import('./PlatformUpdates.jsx'));
import { SERVICE_CATALOG, SERVICE_PRIORITIES, emptyServiceRequest, getServiceCategory, mergeServiceCatalogSettings, sanitizeServiceCatalogSettings, serviceDueDate, serviceRequestStatus, serviceStatusLabel } from './serviceCatalog';
import { activityProductivityMetrics, activityRecurrenceLabel, activityUpdateDescription, createActivityHistoryEntry, createMessageActivity, findMentionedParticipantIds, isMessageActivityOverdue, messageActivityProgress, messageActivitySchedule, messageReplySnapshot, normalizeActivityTemplate, normalizeMessageActivity, toggleMessageUser } from './messageFeatures';
import { ACTIVITY_KANBAN_COLUMNS, activityCalendarMonth, currentActivityCalendarMonth, groupActivityRowsByStatus, shiftActivityCalendarMonth } from './activityViews';
import { buildSupportTickets, filterSupportTickets, supportDashboardMetrics } from './platformSupportDashboard';
import LoginShowcase from './LoginShowcase.jsx';
import { createPortal } from 'react-dom';
import {
  Bell, Users, Megaphone, Layers, Calendar, Clock, Plus, Search, Heart, Smile,
  Share2, UserCheck, Briefcase, Sparkles, Filter, CheckCircle2, BookOpen,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Menu, X, Coffee, Building, Send, Edit2,
  Trash2, MapPin, FileText, ImageIcon, LogOut, Lock, KeyRound,
  PhoneCall, User, Activity, TrendingUp, TrendingDown, MessageSquare,
  Paperclip, File, Download, UserPlus, Upload, Database, LoaderCircle, Check, CheckCheck, Moon, Sun, Settings2,
  Reply, Bookmark, Highlighter, ListChecks, Flag, AtSign, ThumbsUp, Pin, VolumeX, Archive, FlaskConical, ExternalLink, Eye
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, or, orderBy, getDocs, addDoc, deleteDoc, updateDoc,setDoc, onSnapshot, writeBatch, arrayUnion, FieldPath, serverTimestamp, runTransaction, getDocsFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, getBlob, deleteObject } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
const LazyEmojiPicker = lazy(() => import('./LazyEmojiPicker.jsx'));
let notificationDispatcher = null;
const DEFAULT_AVATAR = '/assets/comunica-avatar-neutral.png';
const DEPLOY_ENV = import.meta.env.VITE_DEPLOY_ENV || 'production';
const IS_STAGING = DEPLOY_ENV === 'staging';
const BUSINESS_FILE_MIME_BY_EXTENSION = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv', txt: 'text/plain',
};
const IMAGE_FILE_MIME_BY_EXTENSION = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  bmp: 'image/bmp', svg: 'image/svg+xml', heic: 'image/heic', heif: 'image/heif', avif: 'image/avif',
};
const DOCUMENT_FILE_MAX_BYTES = 50 * 1024 * 1024;
const IMAGE_FILE_MAX_BYTES = 25 * 1024 * 1024;
const DOCUMENT_FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,image/*,audio/*,video/*';
const resolveUploadContentType = file => {
  if (file?.type && file.type !== 'application/octet-stream') return file.type;
  const extension = String(file?.name || '').toLocaleLowerCase('pt-BR').split('.').pop();
  return IMAGE_FILE_MIME_BY_EXTENSION[extension] || BUSINESS_FILE_MIME_BY_EXTENSION[extension] || 'application/octet-stream';
};
const isSupportedBusinessFile = file => {
  const contentType = resolveUploadContentType(file);
  return /^(image|audio|video|text)\//.test(contentType) || Object.values(BUSINESS_FILE_MIME_BY_EXTENSION).includes(contentType);
};
const ACCESS_MODULES = [
  { id: 'dashboard', label: 'Visão geral' },
  { id: 'inbox', label: 'Caixa de entrada' },
  { id: 'announcements', label: 'Avisos e políticas' },
  { id: 'sectors', label: 'Canais de setores' },
  { id: 'polls', label: 'Enquetes e clima' },
  { id: 'documents', label: 'Documentos' },
  { id: 'services', label: 'Central de serviços' },
  { id: 'scale', label: 'Escalas e calendário' },
  { id: 'productivity', label: 'Produtividade' },
  { id: 'careers', label: 'Banco de talentos' },
  { id: 'whistleblowing', label: 'Central de Denúncias' },
  { id: 'updates', label: 'Novidades do Comunica' },
];
const fullAccessProfile = () => ({ tabs: Object.fromEntries(ACCESS_MODULES.map(item => [item.id, item.id !== 'whistleblowing'])), canEdit: true, canManageCalendar: true, canManageScheduleRules: true, canManageActivities: true, canManageActivityTemplates: true, canViewActivityInsights: true, canPublishAbsenceForOthers: false, canViewEngagement: false });
const DEFAULT_AUTOMATIC_SCHEDULE_RULES = {
  name: 'Regra padrão da empresa',
  workDaysPerWeek: 5,
  hoursPerWeek: 40,
  restEveryDays: 7,
  minRestHours: 11,
  maxDailyHours: 12,
  maxWeeklyHours: 44,
  maxExtraHoursPerDay: 2,
  limitSeverity: 'blocking',
  version: 1,
  versionHistory: [],
  shiftStart: '08:00',
  shiftEnd: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  allowedWeekdays: [0, 1, 2, 3, 4, 5, 6],
  employeeOverrides: {},
  ruleGroups: [],
  holidaysCountAsRest: true,
  reuseLastSchedule: true,
  calculateExtraAutomatically: true,
};
const SCHEDULE_CLOCK_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const SCHEDULE_WEEKDAYS = [
  { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' }, { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' }, { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];
const sanitizeAutomaticScheduleRules = (value = {}) => ({
  ...DEFAULT_AUTOMATIC_SCHEDULE_RULES,
  ...value,
  ruleGroups: normalizeRuleGroups(value.ruleGroups),
  shifts: normalizeScheduleShifts(value.shifts),
  coverageRequirements: normalizeCoverageRequirements(value.coverageRequirements),
  name: String(value.name || DEFAULT_AUTOMATIC_SCHEDULE_RULES.name).slice(0, 80),
  workDaysPerWeek: Math.max(1, Math.min(7, Number(value.workDaysPerWeek) || 5)),
  hoursPerWeek: Math.max(1, Math.min(84, Number(value.hoursPerWeek) || 40)),
  restEveryDays: Math.max(2, Math.min(14, Number(value.restEveryDays) || 7)),
  minRestHours: Math.max(0, Math.min(24, Number.isFinite(Number(value.minRestHours)) ? Number(value.minRestHours) : 11)),
  maxDailyHours: Math.max(1, Math.min(24, Number(value.maxDailyHours) || 12)),
  maxWeeklyHours: Math.max(1, Math.min(84, Number(value.maxWeeklyHours) || 44)),
  maxExtraHoursPerDay: Math.max(0, Math.min(12, Number.isFinite(Number(value.maxExtraHoursPerDay)) ? Number(value.maxExtraHoursPerDay) : 2)),
  limitSeverity: value.limitSeverity === 'warning' ? 'warning' : 'blocking',
  version: Math.max(1, Number(value.version) || 1),
  versionHistory: Array.isArray(value.versionHistory) ? value.versionHistory.slice(-12).map(item => ({ version: Math.max(1, Number(item.version) || 1), savedAt: Number(item.savedAt) || 0, savedBy: String(item.savedBy || '').slice(0, 120), summary: String(item.summary || '').slice(0, 240) })) : [],
  shiftStart: SCHEDULE_CLOCK_PATTERN.test(String(value.shiftStart || '')) ? value.shiftStart : DEFAULT_AUTOMATIC_SCHEDULE_RULES.shiftStart,
  shiftEnd: SCHEDULE_CLOCK_PATTERN.test(String(value.shiftEnd || '')) ? value.shiftEnd : DEFAULT_AUTOMATIC_SCHEDULE_RULES.shiftEnd,
  breakStart: SCHEDULE_CLOCK_PATTERN.test(String(value.breakStart || '')) ? value.breakStart : DEFAULT_AUTOMATIC_SCHEDULE_RULES.breakStart,
  breakEnd: SCHEDULE_CLOCK_PATTERN.test(String(value.breakEnd || '')) ? value.breakEnd : DEFAULT_AUTOMATIC_SCHEDULE_RULES.breakEnd,
  allowedWeekdays: Array.isArray(value.allowedWeekdays)
    ? [...new Set(value.allowedWeekdays.map(Number).filter(day => day >= 0 && day <= 6))].sort()
    : [0, 1, 2, 3, 4, 5, 6],
  employeeOverrides: Object.fromEntries(Object.entries(value.employeeOverrides || {}).map(([userId, override]) => [userId, {
    shiftStart: SCHEDULE_CLOCK_PATTERN.test(String(override?.shiftStart || '')) ? override.shiftStart : '',
    shiftEnd: SCHEDULE_CLOCK_PATTERN.test(String(override?.shiftEnd || '')) ? override.shiftEnd : '',
    saturdayEnd: SCHEDULE_CLOCK_PATTERN.test(String(override?.saturdayEnd || '')) ? override.saturdayEnd : '',
  }])),
  holidaysCountAsRest: value.holidaysCountAsRest !== false,
  reuseLastSchedule: value.reuseLastSchedule !== false,
  calculateExtraAutomatically: value.calculateExtraAutomatically !== false,
});
const normalizeAccessProfile = (profile = {}) => ({
  ...fullAccessProfile(),
  ...profile,
  canManageActivities: profile.canEdit === false ? false : profile.canManageActivities !== false,
  canManageActivityTemplates: profile.canManageActivityTemplates === true,
  canViewActivityInsights: profile.canViewActivityInsights === true,
  canManageScheduleRules: profile.canManageCalendar === false ? false : profile.canManageScheduleRules !== false,
  canPublishAbsenceForOthers: profile.canPublishAbsenceForOthers === true,
  tabs: { ...fullAccessProfile().tabs, ...(profile.tabs || {}) },
});
const SERVICE_TONE_CLASSES = {
  blue: 'border-blue-100 bg-blue-50 text-blue-800',
  cyan: 'border-cyan-100 bg-cyan-50 text-cyan-800',
  amber: 'border-amber-100 bg-amber-50 text-amber-800',
  orange: 'border-orange-100 bg-orange-50 text-orange-800',
  violet: 'border-violet-100 bg-violet-50 text-violet-800',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  rose: 'border-rose-100 bg-rose-50 text-rose-800',
  indigo: 'border-indigo-100 bg-indigo-50 text-indigo-800',
};
const SERVICE_STATUS_CLASSES = {
  open: 'border-blue-200 bg-blue-50 text-blue-800',
  in_progress: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  waiting_requester: 'border-violet-200 bg-violet-50 text-violet-800',
  approval: 'border-amber-200 bg-amber-50 text-amber-800',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
  overdue: 'border-red-200 bg-red-50 text-red-800',
  completed: 'border-slate-200 bg-slate-100 text-slate-700',
};
const MESSAGE_ACTIVITY_STATUS_LABELS = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  overdue: 'Em atraso',
  resolved: 'Resolvida',
};
const MESSAGE_ACTIVITY_STATUS_CLASSES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  in_progress: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  overdue: 'border-rose-200 bg-rose-50 text-rose-800',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};
const MESSAGE_ACTIVITY_PRIORITY_LABELS = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};
const triggerNotification = (message, type = 'success') => {
  if (notificationDispatcher) {
    notificationDispatcher(message, type);
    return;
  }
  console.log(`[Notificação]: ${message}`);
};
const fileUploadErrorMessage = (error) => {
  const code = String(error?.code || '');
  if (code.includes('unauthorized')) return 'Seu acesso expirou ou não possui permissão para enviar este arquivo. Entre novamente e tente mais uma vez.';
  if (code.includes('unauthenticated')) return 'Entre novamente para enviar o arquivo.';
  if (code.includes('permission-denied')) return 'Seu cadastro atual não possui permissão para enviar documentos nesta empresa.';
  if (code.includes('canceled')) return 'O envio do arquivo foi cancelado.';
  if (code.includes('retry-limit') || code.includes('network')) return 'A conexão falhou durante o envio. Verifique sua internet e tente novamente.';
  if (code.includes('quota-exceeded')) return 'O armazenamento da empresa atingiu o limite disponível.';
  if (code.includes('object-not-found')) return 'Não foi possível preparar o local de armazenamento do arquivo.';
  return 'Não foi possível enviar o arquivo para a nuvem. Tente novamente.';
};
const NotificationToast = ({ notification }) => {
  if (!notification) return null;
  const isError = notification.type === 'error';
  return (
    <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-[10001] max-w-sm rounded-xl border px-4 py-3 shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-3 duration-300 ${isError ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-900 border-slate-700 text-white'}`}>
      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${isError ? 'text-rose-500' : 'text-emerald-400'}`} />
      <span>{notification.message}</span>
    </div>
  );
};
const CloudActivityIndicator = ({ activity }) => {
  if (!activity?.count) return null;
  return (
    <div role="status" aria-live="polite" className="fixed left-1/2 top-3 z-[10002] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-4 py-2 text-[11px] font-bold text-slate-700 shadow-xl backdrop-blur">
        <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
        <span>{activity.label || 'Processando na nuvem...'}</span>
      </div>
      <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 overflow-hidden rounded-full bg-blue-100"><span className="block h-full w-1/2 animate-pulse rounded-full bg-blue-600" /></span>
    </div>
  );
};
const EnvironmentBadge = () => IS_STAGING ? (
  <div className="fixed left-1/2 top-[max(.5rem,env(safe-area-inset-top))] z-[10050] -translate-x-1/2 rounded-full border border-amber-200 bg-amber-300 px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-amber-950 shadow-lg">
    Ambiente de homologação
  </div>
) : null;
const InstallAppDialog = ({ open, onClose }) => {
  if (!open) return null;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-slate-950/75 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="install-app-title" className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-[#071a36] via-blue-950 to-cyan-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><img src="/pwa/icon-192.png" alt="" className="h-12 w-12 rounded-2xl border border-white/15 shadow-lg" /><div><span className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200">Aplicativo</span><h2 id="install-app-title" className="mt-0.5 text-lg font-black">Instalar o Comunica</h2></div></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Fechar instruções"><X className="h-5 w-5" /></button></div>
        </div>
        <div className="p-6 text-sm leading-6 text-slate-600">
          {isIos ? <><p>No Safari, toque no botão <strong className="text-slate-900">Compartilhar</strong> e escolha <strong className="text-slate-900">Adicionar à Tela de Início</strong>.</p><div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900"><Share2 className="h-5 w-5 shrink-0" /><span className="text-xs font-semibold">Depois confirme em “Adicionar”. O Comunica abrirá como um aplicativo.</span></div></> : <><p>Abra o menu do navegador e escolha <strong className="text-slate-900">Instalar aplicativo</strong> ou <strong className="text-slate-900">Adicionar à tela inicial</strong>.</p><div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-900"><Download className="h-5 w-5 shrink-0" /><span className="text-xs font-semibold">No Chrome, essa opção fica no menu de três pontos.</span></div></>}
          <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white">Entendi</button>
        </div>
      </section>
    </div>
  );
};
const emojiSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('pt-BR', { granularity: 'grapheme' })
  : null;
const isEmojiGrapheme = (value) => /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(value);
const CAREER_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const careerDateMs = value => Number(value) || Number(value?.seconds || 0) * 1000 || value?.toMillis?.() || 0;
const applicationRetentionMs = application => careerDateMs(application.retentionUntil) || (careerDateMs(application.createdAt) || Date.now()) + CAREER_RETENTION_MS;
const formatCareerDate = value => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(value)) : 'Prazo não definido';
const normalizedText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
const isVacationAbsence = absence => normalizedText(absence?.reason) === 'ferias';
const civilDateShift = (value, { days = 0, months = 0 } = {}) => {
  const matched = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return value;
  const date = new Date(Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3])));
  if (months) date.setUTCMonth(date.getUTCMonth() + months);
  if (days) date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};
const civilDateDaysInclusive = (startDate, endDate) => {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  const end = new Date(`${endDate}T12:00:00`).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? Math.floor((end - start) / 86400000) + 1 : 0;
};
const formatDate = (value) => {
  if (!value) return '';
  const civilDate = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (civilDate) return `${civilDate[3]}/${civilDate[2]}/${civilDate[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
};
const VACANCY_QUESTION_TYPES = {
  single: { label: 'Escolha única', hint: 'O candidato escolhe uma alternativa.', options: ['', ''] },
  yesNo: { label: 'Sim ou não', hint: 'Resposta objetiva para requisitos básicos.', options: ['Sim', 'Não'] },
  scale: { label: 'Escala de 1 a 5', hint: 'Ajuda a entender preferência ou percepção.', options: ['1 — Discordo totalmente', '2 — Discordo', '3 — Neutro', '4 — Concordo', '5 — Concordo totalmente'] },
};
const POLL_QUESTION_TYPES = {
  single: { label: 'Escolha única', hint: 'Crie alternativas personalizadas.', options: ['', ''] },
  yesNo: { label: 'Sim ou não', hint: 'Ideal para perguntas objetivas.', options: ['Sim', 'Não'] },
  scale: { label: 'Escala de 1 a 5', hint: 'Meça concordância ou satisfação.', options: ['1 — Muito baixo', '2 — Baixo', '3 — Regular', '4 — Bom', '5 — Excelente'] },
  mood: { label: 'Clima com emojis', hint: 'Uma leitura rápida da percepção da equipe.', options: ['😞 Muito ruim', '😕 Ruim', '😐 Neutro', '🙂 Bom', '🤩 Excelente'] },
};
const createPollQuestion = (type = 'single') => ({ type, question: '', options: [...(POLL_QUESTION_TYPES[type]?.options || POLL_QUESTION_TYPES.single.options)] });
const createVacancyQuestion = (type = 'single') => ({ type, question: '', options: [...(VACANCY_QUESTION_TYPES[type]?.options || VACANCY_QUESTION_TYPES.single.options)] });
const normalizeVacancyQuiz = questions => {
  if (!Array.isArray(questions) || !questions.length) return [];
  if (questions.length > 10) throw new Error('Use no máximo 10 perguntas no questionário.');
  return questions.map((item, index) => {
    const type = VACANCY_QUESTION_TYPES[item.type] ? item.type : 'single';
    const question = String(item.question || '').trim();
    const options = type === 'single'
      ? (item.options || []).map(option => String(option || '').trim()).filter(Boolean)
      : [...VACANCY_QUESTION_TYPES[type].options];
    if (!question) throw new Error(`Escreva o enunciado da pergunta ${index + 1}.`);
    if (options.length < 2 || options.length > 8) throw new Error(`A pergunta ${index + 1} precisa ter de 2 a 8 opções.`);
    return { question, type, options };
  });
};

const TextoComEmojis = ({ texto }) => {
  if (typeof texto !== 'string') return texto;
  return <span className="whitespace-pre-wrap">{texto}</span>;
};

const PreviaEmojis = ({ texto }) => {
  if (!emojiSegmenter || !texto) return null;
  const selected = [...emojiSegmenter.segment(texto)].map(part => part.segment).filter(isEmojiGrapheme);
  if (!selected.length) return null;
  return <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50/80 border border-emerald-100 px-3 py-2 text-xs text-slate-600"><span className="font-medium shrink-0">Prévia:</span><span className="flex flex-wrap items-center gap-1"><TextoComEmojis texto={[...new Set(selected)].join(' ')} /></span></div>;
};

const BotaoEmoji = ({ aoSelecionar }) => {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({ top: 8, left: 8, width: 340, height: 460 });
  const botaoRef = useRef(null);
  const painelRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const fecharFora = (event) => {
      if (!painelRef.current?.contains(event.target) && !botaoRef.current?.contains(event.target)) setAberto(false);
    };
    const fecharEscape = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setAberto(false);
      }
    };
    document.addEventListener('pointerdown', fecharFora, true);
    document.addEventListener('keydown', fecharEscape, true);
    return () => {
      document.removeEventListener('pointerdown', fecharFora, true);
      document.removeEventListener('keydown', fecharEscape, true);
    };
  }, [aberto]);

  const alternarPicker = () => {
    if (!aberto && botaoRef.current) {
      const rect = botaoRef.current.getBoundingClientRect();
      const pickerWidth = Math.min(352, window.innerWidth - 16);
      const pickerHeight = Math.min(492, window.innerHeight - 16);
      setPosicao({
        top: Math.max(8, rect.top > pickerHeight ? rect.top - pickerHeight - 8 : Math.min(Math.max(8, window.innerHeight - pickerHeight - 8), rect.bottom + 8)),
        left: Math.max(8, Math.min(window.innerWidth - pickerWidth - 8, rect.right - pickerWidth)),
        width: pickerWidth,
        height: pickerHeight,
      });
    }
    setAberto(value => !value);
  };

  const obterEmojiSelecionado = (dadosEmoji) => {
    if (typeof dadosEmoji?.emoji === 'string' && dadosEmoji.emoji) return dadosEmoji.emoji;
    if (typeof dadosEmoji?.native === 'string' && dadosEmoji.native) return dadosEmoji.native;
    if (typeof dadosEmoji?.unified === 'string' && dadosEmoji.unified) {
      try {
        return String.fromCodePoint(...dadosEmoji.unified.split('-').map(codigo => parseInt(codigo, 16)));
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <div className="relative inline-block mt-1">
      <button
        ref={botaoRef}
        type="button"
        onClick={alternarPicker}
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
        title="Inserir emoji"
        aria-label="Abrir seletor de emojis"
        aria-expanded={aberto}
      >
        <Smile className="h-5 w-5 text-slate-500" />
      </button>

      {aberto && createPortal(
        <div ref={painelRef} data-comunica-emoji-picker="true" className="comunica-emoji-panel fixed z-[10000] shadow-2xl border border-slate-200 bg-white rounded-2xl overflow-hidden" style={{ top: posicao.top, left: posicao.left, width: posicao.width, height: posicao.height }}>
          <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100"><span className="text-sm font-semibold text-slate-800">Emojis</span><button type="button" onClick={() => setAberto(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar emojis"><X className="h-4 w-4" /></button></div>
          <Suspense fallback={<div className="grid h-full place-items-center text-xs font-semibold text-slate-500" role="status">Carregando emojis…</div>}>
            <LazyEmojiPicker height={posicao.height - 48} onSelect={(emojiObject) => {
              const emoji = obterEmojiSelecionado(emojiObject);
              if (emoji) aoSelecionar(emoji);
              setAberto(false);
            }} />
          </Suspense>
        </div>,
        document.body
      )}
    </div>
  );
};
const SECTOR_COLORS = [];
const DOCUMENT_CATEGORIES = ['Geral', 'RH', 'Políticas', 'Segurança', 'Produção', 'Financeiro', 'Treinamentos', 'Manuais', 'Qualidade', 'Outros'];

const INITIAL_DEPARTMENTS = [];

const INITIAL_USERS = [];

const INITIAL_ROLES = [];

const INITIAL_ANNOUNCEMENTS = [];

const INITIAL_SECTOR_POSTS = [];

const INITIAL_CALENDAR_EVENTS = [];

const INITIAL_ABSENCES = [];

const INITIAL_PRESENCE = [];

const INITIAL_PRODUCTIVITY = [];
const INITIAL_MESSAGES = [];

let app, auth, db, storage, functionsClient, appId;
let authPersistenceReady = Promise.resolve();
let isFirebaseAvailable = false;
  // --- CONFIGURAÇÃO CORRETA ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const firebaseEnvironmentError = IS_STAGING && firebaseConfig.projectId === 'comunica-salvador'
  ? 'A homologação tentou usar o projeto de produção e foi bloqueada.'
  : '';

try {
  if (firebaseEnvironmentError) throw new Error(firebaseEnvironmentError);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch(error => {
    console.error('Não foi possível ativar a permanência da sessão neste dispositivo.', error);
  });
  db = getFirestore(app);
  storage = getStorage(app);
  // Conexões móveis e Wi-Fi instável podem interromper arquivos maiores. O envio
  // retomável usa esta janela para continuar do ponto em que parou.
  storage.maxUploadRetryTime = 30 * 60 * 1000;
  functionsClient = getFunctions(app, 'us-central1');
  appId = import.meta.env.VITE_APP_DATA_ID || "comunica-salvador";
  isFirebaseAvailable = true;
} catch (e) {
  console.warn("Firebase não disponível. Usando LocalStorage.", e);
}

const getLocalStorageItem = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalStorageSafe = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Quota excedida ao tentar salvar no LocalStorage: ${key}`);
  }
};

const getUserDepts = (user) => {
  if (!user) return [];
  if (user.departments && Array.isArray(user.departments) && user.departments.length > 0) return user.departments;
  if (user.depts && Array.isArray(user.depts) && user.depts.length > 0) return user.depts;
  if (user.department) return [user.department];
  if (user.dept) return [user.dept];
  return [];
};
const getRoleDepts = (role) => {
  if (!role) return [];
  if (Array.isArray(role.depts) && role.depts.length) return [...new Set(role.depts.filter(Boolean))];
  if (role.dept) return [role.dept];
  return [];
};
const isCareerManagerUser = user => {
  if (!user) return false;
  if (user.isAdmin || user.isDeveloper) return true;
  const values = [user.role, ...getUserDepts(user)].map(value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR'));
  return values.some(value => value === 'rh' || value.includes('recursos humanos') || /(^|[^a-z])rh([^a-z]|$)/.test(value));
};

const callGemini = async (prompt, sysInstruction) => {
  try {
    if (!functionsClient) throw new Error('Serviço de IA indisponível.');
    const generateAiText = httpsCallable(functionsClient, 'generateAiText');
    const response = await generateAiText({ prompt, systemInstruction: sysInstruction });
    return response.data?.text || '';
  } catch (error) {
    console.error("Erro na chamada do Gemini:", error);
    return "Tive um problema temporário para processar sua mensagem. Pode tentar novamente?";
  }
};

const formatAIText = (text) => String(text || '')
  .replace(/```[\s\S]*?```/g, '')
  .replace(/[*#`]/g, '')
  .replace(/^\s*\d+[.)]\s+/gm, '• ')
  .replace(/^\s*[-•]\s*/gm, '• ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export default function App() {
  const getRelativeDate = (dateString) => {
  return dateString;
};

const handleDownload = async (fileOrUrl, fallbackName = "anexo") => {
  let previewWindow = null;
  const waitForFileAccess = promise => new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Tempo esgotado ao preparar o arquivo.')), 20000);
    promise.then(
      value => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      error => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

  try {
    const file = typeof fileOrUrl === 'string' ? { data: fileOrUrl, name: fallbackName } : (fileOrUrl || {});
    const fileUrl = file.data || file.url || '';
    const fileName = file.name || fallbackName;
    if (!fileUrl && !file.storagePath) {
      triggerNotification('Este anexo não possui um arquivo disponível.', 'error');
      return;
    }

    // Arquivos internos são sempre lidos pelo SDK autenticado. Isso revalida as
    // regras do Storage em cada abertura, inclusive após mudança de permissão.
    const isFirebaseFile = Boolean(file.storagePath) || /firebasestorage\.googleapis\.com|storage\.googleapis\.com/i.test(fileUrl);
    if (storage && isFirebaseFile) {
      const fileRef = ref(storage, file.storagePath || fileUrl);
      const isMobileBrowser = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isNativeContainer = Boolean(window.cordova || window.Capacitor);
      const normalizedType = String(file.type || '').toLowerCase();
      const expectsInlinePreview = normalizedType === 'application/pdf'
        || normalizedType.startsWith('image/')
        || /\.(?:pdf|png|jpe?g|gif|webp|bmp|svg|avif)(?:$|[?#])/i.test(fileName);

      const hasDirectFirebaseUrl = /^https:\/\//i.test(fileUrl)
        && /firebasestorage\.googleapis\.com|storage\.googleapis\.com/i.test(fileUrl)
        && /[?&]token=/.test(fileUrl);

      // O upload já salva uma URL individual autorizada no registro da mensagem.
      // Abra-a durante o clique original: navegadores podem impedir que uma aba
      // about:blank seja redirecionada depois de uma operação assíncrona.
      if (hasDirectFirebaseUrl) {
        if (isNativeContainer) {
          window.open(fileUrl, '_system');
          return;
        }
        const directWindow = window.open(fileUrl, '_blank');
        if (directWindow) {
          directWindow.opener = null;
          return;
        }
        const directLink = document.createElement('a');
        directLink.href = fileUrl;
        directLink.target = '_blank';
        directLink.rel = 'noopener noreferrer';
        document.body.appendChild(directLink);
        directLink.click();
        document.body.removeChild(directLink);
        return;
      }

      // No celular, só criamos uma nova aba para formatos que o navegador
      // realmente consegue visualizar. Documentos de escritório e outros
      // formatos seguem direto para download, sem deixar uma aba em branco.
      if (isMobileBrowser && (isNativeContainer || expectsInlinePreview)) {
        if (!isNativeContainer) {
          previewWindow = window.open('about:blank', '_blank');
          if (previewWindow) {
            try {
              previewWindow.document.title = 'Abrindo arquivo';
              previewWindow.document.body.style.cssText = 'margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f8fafc;color:#334155';
              previewWindow.document.body.textContent = 'Carregando arquivo…';
            } catch {
              // Alguns navegadores não permitem personalizar a aba intermediária.
            }
          }
        }

        const authenticatedUrl = await waitForFileAccess(getDownloadURL(fileRef));
        if (isNativeContainer) {
          window.open(authenticatedUrl, '_system');
          return;
        }
        if (previewWindow && !previewWindow.closed) {
          previewWindow.location.href = authenticatedUrl;
          return;
        }

        throw new Error('O navegador bloqueou a abertura do arquivo. Permita pop-ups para o Comunica e tente novamente.');
      }

      if (expectsInlinePreview) {
        previewWindow = window.open('about:blank', '_blank');
        if (previewWindow) {
          try {
            previewWindow.document.title = 'Abrindo arquivo';
            previewWindow.document.body.style.cssText = 'margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f8fafc;color:#334155';
            previewWindow.document.body.textContent = 'Carregando arquivo…';
          } catch {
            // Alguns navegadores não permitem personalizar a aba intermediária.
          }
        }
      }

      const blob = await waitForFileAccess(getBlob(fileRef));
      const objectUrl = window.URL.createObjectURL(blob);
      const canPreviewInline = expectsInlinePreview || blob.type === 'application/pdf' || blob.type.startsWith('image/');

      if (previewWindow && canPreviewInline) {
        previewWindow.location.href = objectUrl;
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
        return;
      }

      if (previewWindow) {
        previewWindow.close();
        previewWindow = null;
      }

      const link = document.createElement('a');
      link.href = objectUrl;
      if (canPreviewInline && !isMobileBrowser) {
        link.target = '_blank';
        link.rel = 'noopener';
      } else {
        link.download = fileName;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
      return;
    }

    // Links externos continuam usando o fluxo normal do navegador/aplicativo.
    if (window.cordova || window.Capacitor) {
      window.open(fileUrl, '_system');
      return;
    }
    const link = document.createElement("a");
    link.href = fileUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    console.error("Erro ao abrir o arquivo:", error);
    const errorMessage = error?.code === 'storage/unauthorized'
      ? 'Você não possui mais permissão para abrir este arquivo.'
      : (error?.message?.includes('pop-ups')
        ? error.message
        : 'Não foi possível abrir o arquivo. Verifique a conexão e tente novamente.');
    triggerNotification(errorMessage, 'error');
  }
};
  const [departmentsList, setDepartmentsList] = useState(() => getLocalStorageItem('comunica_departments', INITIAL_DEPARTMENTS));
  const [usersList, setUsersList] = useState(() => getLocalStorageItem('comunica_users', INITIAL_USERS));
  const employeesList = usersList.filter(isCompanyEmployee);
  const messageContacts = withPlatformSupport(usersList);
  const [supportRequests, setSupportRequests] = useState({});
  const [supportLoadError, setSupportLoadError] = useState(false);
  const [supportTicketSearch, setSupportTicketSearch] = useState('');
  const [supportTicketFilter, setSupportTicketFilter] = useState('all');
  const [supportWorkspace, setSupportWorkspace] = useState('operation');
  const [supportCompanySearch, setSupportCompanySearch] = useState('');
  const [supportCompanyHealth, setSupportCompanyHealth] = useState({ generatedAt: 0, companies: [] });
  const [supportHealthLoading, setSupportHealthLoading] = useState(false);
  const [supportHealthError, setSupportHealthError] = useState('');
  const [salesLeads, setSalesLeads] = useState([]);
  const [salesLeadError, setSalesLeadError] = useState(false);
  const [rolesList, setRolesList] = useState(() => getLocalStorageItem('comunica_roles', INITIAL_ROLES));
  const [announcements, setAnnouncements] = useState(() => getLocalStorageItem('comunica_announcements', INITIAL_ANNOUNCEMENTS));
  const [sectorPosts, setSectorPosts] = useState(() => getLocalStorageItem('comunica_sector_posts', INITIAL_SECTOR_POSTS));
  const [productivityLogs, setProductivityLogs] = useState(() => getLocalStorageItem('comunica_productivity', INITIAL_PRODUCTIVITY));
  const [privateMessages, setPrivateMessages] = useState(() => getLocalStorageItem('comunica_messages', INITIAL_MESSAGES));
  const [serviceManagementMessages, setServiceManagementMessages] = useState([]);
  const [standaloneActivities, setStandaloneActivities] = useState([]);
  const [activityTemplates, setActivityTemplates] = useState([]);
  const [presenceList, setPresenceList] = useState(() => getLocalStorageItem('comunica_presence', INITIAL_PRESENCE));
  const [calendarEvents, setCalendarEvents] = useState(() => getLocalStorageItem('comunica_calendar_events', INITIAL_CALENDAR_EVENTS));
  const [absences, setAbsences] = useState(() => getLocalStorageItem('comunica_absences', INITIAL_ABSENCES));
  const [workSchedules, setWorkSchedules] = useState(() => getLocalStorageItem('comunica_work_schedules', []));
  const [scheduleSwapRequests, setScheduleSwapRequests] = useState(() => getLocalStorageItem('comunica_schedule_swap_requests', []));
  const [deletingScheduleId, setDeletingScheduleId] = useState('');
  const [documentsList, setDocumentsList] = useState(() => getLocalStorageItem('comunica_documents', []));
  const [pollsList, setPollsList] = useState(() => getLocalStorageItem('comunica_polls', []));
  const [vacanciesList, setVacanciesList] = useState([]);
  const [careerApplications, setCareerApplications] = useState([]);
  const [careerVacancyFilter, setCareerVacancyFilter] = useState('all');
  const [careerSourceFilter, setCareerSourceFilter] = useState('all');
  const [careerCandidateSearch, setCareerCandidateSearch] = useState('');
  const [careerStageFilter, setCareerStageFilter] = useState('all');
  const [careerFitFilter, setCareerFitFilter] = useState('all');
  const [careerCityFilter, setCareerCityFilter] = useState('all');
  const [careerSort, setCareerSort] = useState('recent');
  const [careerViewMode, setCareerViewMode] = useState('pipeline');
  const [careerComparisonIds, setCareerComparisonIds] = useState([]);
  const [careerInterviewDraft, setCareerInterviewDraft] = useState(null);
  const [careerDecisionDraft, setCareerDecisionDraft] = useState(null);
  const [careerAiAnalyzingId, setCareerAiAnalyzingId] = useState('');
  const [careerAnalysisSelectedId, setCareerAnalysisSelectedId] = useState('');
  const [showArchivedVacancies, setShowArchivedVacancies] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [accessControl, setAccessControl] = useState({ sectorPermissions: {} });
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [controlCenterTab, setControlCenterTab] = useState('permissions');
  const [permissionScope, setPermissionScope] = useState('user');
  const [permissionTargetId, setPermissionTargetId] = useState('');
  const [permissionDraft, setPermissionDraft] = useState(fullAccessProfile());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPersonFilter, setAuditPersonFilter] = useState('all');
  const [auditAreaFilter, setAuditAreaFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [conversationAuditPeriod, setConversationAuditPeriod] = useState('30');
  const [conversationAuditStatus, setConversationAuditStatus] = useState('all');
  const [conversationAuditPerson, setConversationAuditPerson] = useState('all');

  // Sessão de usuário com persistência local
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('comunica_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('comunica_theme') === 'dark');
  const [mgmtSubTab, setMgmtSubTab] = useState('employees');
  const [dashboardDetail, setDashboardDetail] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(() => {
    const saved = localStorage.getItem('comunica_active_company');
    return saved ? JSON.parse(saved) : null;
  });
  const [companyCode, setCompanyCode] = useState('');
  // Impede que uma consulta antiga (por exemplo, "082") apague o resultado
  // correto de uma digitação posterior ("082026").
  const companyLookupRequestRef = useRef(0);
  const [showDeveloperLogin, setShowDeveloperLogin] = useState(false);
  const [developerPin, setDeveloperPin] = useState('');
  const [showCompanyRegistration, setShowCompanyRegistration] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', code: '', adminName: '', adminPin: '' });

  // Estados para login e segurança
  const [loginSelectedUserId, setLoginSelectedUserId] = useState('');
  const [loginSearchText, setLoginSearchText] = useState('');
  const [showLoginSuggestions, setShowLoginSuggestions] = useState(false);
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [showPinFieldsInProfile, setShowPinFieldsInProfile] = useState(false);

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [forcePinChange, setForcePinChange] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const pinChangeInFlight = useRef(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const [browserPushGranted, setBrowserPushGranted] = useState(() => 'Notification' in window && Notification.permission === 'granted');

  const [announcementFilter, setAnnouncementFilter] = useState('Todos');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAnnModal, setShowAnnModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [confirmCareerCleanup, setConfirmCareerCleanup] = useState(false);
  const careerRetentionCompanyRef = useRef('');
  const careerExpiryNoticeRef = useRef('');
  const careerCandidateUpdateNoticeRef = useRef('');
  const [newVacancy, setNewVacancy] = useState({ roleId: '', title: '', description: '', location: '', mode: 'Presencial', skills: '', quiz: [], closesAt: '' });
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pendingUserRemoval, setPendingUserRemoval] = useState(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);
  const [pendingContentDeletion, setPendingContentDeletion] = useState(null);
  const [isDeletingContent, setIsDeletingContent] = useState(false);
  const userSaveInFlight = useRef(false);
  const [pinResetTarget, setPinResetTarget] = useState(null);
  const [adminNewPin, setAdminNewPin] = useState('');
  const [adminConfirmPin, setAdminConfirmPin] = useState('');
  const [pinResetSaving, setPinResetSaving] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  // Novos Estados para o Chat com Suporte a Grupos e Anexos
  const [isComposingMsg, setIsComposingMsg] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threadHeaderExpanded, setThreadHeaderExpanded] = useState(false);
  const [pendingThreadDueDate, setPendingThreadDueDate] = useState('');
  const [showResolutionEvaluation, setShowResolutionEvaluation] = useState(false);
  const [resolutionRating, setResolutionRating] = useState(0);
  const [resolutionFeedback, setResolutionFeedback] = useState('');
  const [messageOrganization, setMessageOrganization] = useState('person');
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxStatusFilter, setInboxStatusFilter] = useState('all');
  const [inboxSort, setInboxSort] = useState('smart');
  const [selectedInboxThreadIds, setSelectedInboxThreadIds] = useState([]);
  const [showThreadInfoPanel, setShowThreadInfoPanel] = useState(false);
  const [threadInfoTab, setThreadInfoTab] = useState('summary');
  const [showArchivedThreads, setShowArchivedThreads] = useState(false);
  const [msgRecipientIds, setMsgRecipientIds] = useState([]);
  const [conversationDraftThreadId, setConversationDraftThreadId] = useState('');
  const [msgSearchText, setMsgSearchText] = useState('');
  const [showMsgSuggestions, setShowMsgSuggestions] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgDueDate, setMsgDueDate] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgAttachment, setMsgAttachment] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [checklistDrafts, setChecklistDrafts] = useState({});
  const [messageFocusFilter, setMessageFocusFilter] = useState('all');
  const [activityMessageTargetId, setActivityMessageTargetId] = useState('');
  const [isUploadingMessageAttachment, setIsUploadingMessageAttachment] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messageUploadInFlight = useRef(false);
  const messageSendInFlight = useRef(false);
  const messageListRef = useRef(null);
  const [pendingMessageNavigation, setPendingMessageNavigation] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('messageCompany');
    const threadId = params.get('messageThread');
    const messageId = params.get('messageId');
    const activityCompany = params.get('activityCompany');
    const activityId = params.get('activityId');
    if (activityCompany && activityId) return {companyId: activityCompany, activityId};
    return companyId && threadId ? {companyId, threadId, messageId} : null;
  });
  const [pendingSalesLeadId, setPendingSalesLeadId] = useState(() => new URLSearchParams(window.location.search).get('supportLead') || '');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipantId, setNewParticipantId] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [serviceDraft, setServiceDraft] = useState(() => emptyServiceRequest());
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceWorkspace, setServiceWorkspace] = useState('requests');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('active');
  const [serviceAssigneeFilter, setServiceAssigneeFilter] = useState('all');
  const [serviceManagementPeriod, setServiceManagementPeriod] = useState('30');
  const [serviceManagementEmployee, setServiceManagementEmployee] = useState('all');
  const [serviceManagementStatus, setServiceManagementStatus] = useState('all');
  const [serviceActivitySearch, setServiceActivitySearch] = useState('');
  const [serviceActivityStatusFilter, setServiceActivityStatusFilter] = useState('active');
  const [serviceActivityPriorityFilter, setServiceActivityPriorityFilter] = useState('all');
  const [serviceActivityAssigneeFilter, setServiceActivityAssigneeFilter] = useState('all');
  const [serviceActivityPeriodFilter, setServiceActivityPeriodFilter] = useState('all');
  const [serviceActivityView, setServiceActivityView] = useState(() => {
    const storedView = localStorage.getItem('comunica_activity_view');
    return ['list', 'kanban', 'calendar'].includes(storedView) ? storedView : 'list';
  });
  const [serviceActivityCalendarMonth, setServiceActivityCalendarMonth] = useState(() => currentActivityCalendarMonth());
  const [selectedServiceActivityKey, setSelectedServiceActivityKey] = useState('');
  const [activityDetailTab, setActivityDetailTab] = useState('comments');
  const [activityCommentDraft, setActivityCommentDraft] = useState('');
  const [activityAttachmentProgress, setActivityAttachmentProgress] = useState(null);
  const [standaloneActivityFormOpen, setStandaloneActivityFormOpen] = useState(false);
  const [standaloneActivityDraft, setStandaloneActivityDraft] = useState({ title: '', description: '', priority: 'normal', dueDate: '', assigneeId: '', recurrence: 'none', templateId: '', checklistText: '' });
  const [activityTemplateDraft, setActivityTemplateDraft] = useState({ name: '', description: '', priority: 'normal', checklistText: '' });
  const [activityTemplatesOpen, setActivityTemplatesOpen] = useState(false);
  const [isSavingStandaloneActivity, setIsSavingStandaloneActivity] = useState(false);
  const [isCreatingServiceRequest, setIsCreatingServiceRequest] = useState(false);
  const [serviceCatalogSettings, setServiceCatalogSettings] = useState(() => sanitizeServiceCatalogSettings({}));
  const [serviceSettingsDraft, setServiceSettingsDraft] = useState(() => sanitizeServiceCatalogSettings({}));
  const [serviceSettingsOpen, setServiceSettingsOpen] = useState(false);
  const [isSavingServiceSettings, setIsSavingServiceSettings] = useState(false);
  const [serviceRecipientSearch, setServiceRecipientSearch] = useState('');
  const [serviceDeliveryDraft, setServiceDeliveryDraft] = useState('');
  const [serviceProgressDraft, setServiceProgressDraft] = useState(0);
  const [serviceProgressNoteDraft, setServiceProgressNoteDraft] = useState('');

  const [editingUser, setEditingUser] = useState(null);

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [platformUpdates, setPlatformUpdates] = useState([]);
  const [platformUpdateReadIds, setPlatformUpdateReadIds] = useState(() => new Set());

  const todayObj = new Date();
  const todayYYYY = todayObj.getFullYear();
  const todayMM = String(todayObj.getMonth() + 1).padStart(2, '0');
  const todayDD = String(todayObj.getDate()).padStart(2, '0');
  const todayStr = `${todayYYYY}-${todayMM}-${todayDD}`;

  const [selectedCalendarDay, setSelectedCalendarDay] = useState(todayStr);

  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'Aviso Geral', image: '' });
  const [newDocument, setNewDocument] = useState({ id: '', title: '', description: '', dept: 'all', accessMode: 'company', allowedUserIds: [], category: 'Geral', folder: '', tags: '', version: '1.0', reviewDate: '', requiredRead: false, file: null });
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(0);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const documentSaveInFlight = useRef(false);
  const documentUploadTask = useRef(null);
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentCategoryFilter, setDocumentCategoryFilter] = useState('Todos');
  const [documentFolderFilter, setDocumentFolderFilter] = useState('Todas as pastas');
  const [documentDepartmentFilter, setDocumentDepartmentFilter] = useState('Todos os setores');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('Todos os tipos');
  const [documentReadingFilter, setDocumentReadingFilter] = useState('Todos');
  const [documentReviewFilter, setDocumentReviewFilter] = useState('Todas');
  const [documentSort, setDocumentSort] = useState('recentes');
  const [showDocumentFilters, setShowDocumentFilters] = useState(false);
  const [editingDocumentFolderId, setEditingDocumentFolderId] = useState(null);
  const [editingDocumentFolder, setEditingDocumentFolder] = useState('');
  const [editingDocumentReviewId, setEditingDocumentReviewId] = useState(null);
  const [editingDocumentReviewDate, setEditingDocumentReviewDate] = useState('');
  const [newPoll, setNewPoll] = useState({ category: 'Pulso da equipe', question: '', type: 'single', options: ['', ''], expiresAt: '' });
  const [pollCreationMode, setPollCreationMode] = useState('enquete');
  const [newPollForm, setNewPollForm] = useState({ title: '', description: '', category: 'Pesquisa de clima', questions: [createPollQuestion('scale')], expiresAt: '' });
  const [pollViewFilter, setPollViewFilter] = useState('Todas');
  const [pollSearch, setPollSearch] = useState('');
  const [supportForm, setSupportForm] = useState({ subject: '', description: '' });
  const [newPost, setNewPost] = useState({ title: '', content: '', depts: [], tags: '', image: '' });
const [newGoal, setNewGoal] = useState({ group: 'Máquina 1', startDate: todayStr, targetDate: todayStr, targetQuantity: '', prizeValue: '' });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newProdLog, setNewProdLog] = useState({
    group: 'Máquina 1',
    date: todayStr,
    quantity: '',
    defects: '',
    productDescription: '',
    notes: '',
    image: ''
  });
  const [editingProdId, setEditingProdId] = useState(null);
  const [newPresence, setNewPresence] = useState({ name: '', dept: 'rh', status: 'Presencial', notes: '', startDate: todayStr, endDate: todayStr });
  const [newAbsence, setNewAbsence] = useState({ targetUserId: '', startDate: todayStr, endDate: todayStr, startTime: '09:00', endTime: '12:00', reason: '' });
  const [bulkSchedule, setBulkSchedule] = useState({
    startDate: todayStr, endDate: todayStr, status: 'Folga', dept: 'Todos', userIds: [], notes: '',
    employeeSearch: '', role: 'Todos', selectionFilter: 'Todos', shift: 'Integral', customShiftStart: '', customShiftEnd: '',
    repeatCount: 1, repeatInterval: 'semanal'
  });
  const [bulkScheduleMode, setBulkScheduleMode] = useState('smart');
  const [scheduleCoverageSources, setScheduleCoverageSources] = useState({});
  const [scheduleCoverageReady, setScheduleCoverageReady] = useState(false);
  const [scheduleCoverageError, setScheduleCoverageError] = useState('');
  const [automaticScheduleRules, setAutomaticScheduleRules] = useState(() => sanitizeAutomaticScheduleRules({}));
  const [automaticScheduleWeeklyHoursText, setAutomaticScheduleWeeklyHoursText] = useState('40:00');
  const [automaticScheduleHolidayDraft, setAutomaticScheduleHolidayDraft] = useState({ companyId: '', assignments: {} });
  const automaticScheduleHolidayAssignments = automaticScheduleHolidayDraft.companyId === activeCompany?.id ? automaticScheduleHolidayDraft.assignments : {};
  const [automaticScheduleRuleTab, setAutomaticScheduleRuleTab] = useState('rules');
  const [isSavingScheduleRules, setIsSavingScheduleRules] = useState(false);
  const [automaticScheduleProposal, setAutomaticScheduleProposal] = useState([]);
  const [automaticScheduleProposalInput, setAutomaticScheduleProposalInput] = useState('');
  const [automaticScheduleProblem, setAutomaticScheduleProblem] = useState(null);
  const [automaticScheduleDraftRestore, setAutomaticScheduleDraftRestore] = useState(null);
  const [automaticScheduleOptimization, setAutomaticScheduleOptimization] = useState(null);
  const [isSavingScheduleProposal, setIsSavingScheduleProposal] = useState(false);
  const [publishedScheduleEdit, setPublishedScheduleEdit] = useState(null);
  const [publishedScheduleSwap, setPublishedScheduleSwap] = useState(null);
  const [publishedScheduleSwapRequest, setPublishedScheduleSwapRequest] = useState(null);
  const [isSavingPublishedSchedule, setIsSavingPublishedSchedule] = useState(false);
  const [isSavingScheduleSwapRequest, setIsSavingScheduleSwapRequest] = useState(false);
  const [automaticScheduleEditorFocus, setAutomaticScheduleEditorFocus] = useState(null);
  const automaticScheduleInput = JSON.stringify({ company: activeCompany?.id, history: workSchedules, absences, employees: employeesList.map(user => ({ id: user.id, name: user.name, departments: getUserDepts(user) })), rules: automaticScheduleRules, holidayAssignments: automaticScheduleHolidayAssignments, hours: automaticScheduleWeeklyHoursText, start: bulkSchedule.startDate, end: bulkSchedule.endDate, users: bulkSchedule.userIds, holidays: calendarEvents.filter(event => normalizedText(`${event.type || ''} ${event.title || ''}`).includes('feriado')).map(event => event.date).sort() });
  useEffect(() => {
    if (!automaticScheduleDraftRestore || automaticScheduleDraftRestore.companyId !== activeCompany?.id) return;
    let cancelled = false;
    scheduleDraftHash(automaticScheduleInput).then(hash => {
      if (cancelled) return;
      if (hash === automaticScheduleDraftRestore.inputHash) setAutomaticScheduleProposalInput(automaticScheduleInput);
      setAutomaticScheduleDraftRestore(null);
    }).catch(() => { if (!cancelled) setAutomaticScheduleDraftRestore(null); });
    return () => { cancelled = true; };
  }, [automaticScheduleDraftRestore, automaticScheduleInput, activeCompany?.id]);
  const [automaticSchedulePreviewDate, setAutomaticSchedulePreviewDate] = useState('');
  const automaticScheduleDayEditorRef = useRef(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: todayStr, type: 'Confraternização', location: '', description: '' });

  // Atualizado com campos separados de contato de emergência
  const [userForm, setUserForm] = useState({
    name: '',
    role: '',
    depts: [],
    avatar: DEFAULT_AVATAR,
    isAdmin: false,
    pin: '1234',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    prodGroup: '',
    managerId: '',
    birthDate: '',
    hireDate: ''
  });
  const [myProfileForm, setMyProfileForm] = useState({
    avatar: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: ''
  });
  const [prodFilterStart, setProdFilterStart] = useState(todayStr);
  const [prodFilterEnd, setProdFilterEnd] = useState(todayStr);
  const [prodFilterGroup, setProdFilterGroup] = useState('Todos');
  const [prodFilterDescription, setProdFilterDescription] = useState('');
  const [prodFilterAuthor, setProdFilterAuthor] = useState('Todos');

  const [empSearchText, setEmpSearchText] = useState('');
  const [empSectorFilter, setEmpSectorFilter] = useState('Todos');
  const [empRoleFilter, setEmpRoleFilter] = useState('Todos');
  const [empProdGroupFilter, setEmpProdGroupFilter] = useState('Todos');

  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorColor, setNewSectorColor] = useState('bg-slate-900 text-white border-slate-800');
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [editingSectorName, setEditingSectorName] = useState('');
  const [editingSectorColor, setEditingSectorColor] = useState('bg-slate-900 text-white border-slate-800');

  const [newRoleValue, setNewRoleValue] = useState('');
  const [newRoleDepts, setNewRoleDepts] = useState([]);
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [editingRoleIdx, setEditingRoleIdx] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState('');
  const [editingRoleDepts, setEditingRoleDepts] = useState([]);
  const [editingRoleDescription, setEditingRoleDescription] = useState('');
  const [engagementDetail, setEngagementDetail] = useState(null);

  const [commentText, setCommentText] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customNotification, setCustomNotification] = useState(null);
  const notificationTimerRef = useRef(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Olá! Sou o ComunicaAI. Estou aqui para ajudar você a encontrar informações sobre ausências, escalas de trabalho, cargos dos setores, comunicados internos do RH e eventos da Comunica. Em que posso ajudar hoje?' }
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle('comunica-dark', isDarkMode);
    localStorage.setItem('comunica_theme', isDarkMode ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDarkMode ? '#0b1220' : '#071a36');
  }, [isDarkMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    const validIds = new Set(departmentsList.map(dept => dept.id));
    setNewRoleDepts(previous => previous.filter(id => validIds.has(id)));
    setEditingRoleDepts(previous => previous.filter(id => validIds.has(id)));
  }, [departmentsList]);
  useEffect(() => {
    setThreadHeaderExpanded(false);
    setShowAddParticipant(false);
  }, [activeThreadId]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [selectedTone, setSelectedTone] = useState('profissional');
  const [isImprovingAnn, setIsImprovingAnn] = useState(false);
  const [isImprovingPost, setIsImprovingPost] = useState(false);
  const [copilotWarning, setCopilotWarning] = useState('');

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');

  const [dbUser, setDbUser] = useState(null);
  const [dbLoading, setDbLoading] = useState(isFirebaseAvailable);

  useEffect(() => {
    if (dbLoading || !currentUser?.id || !activeCompany?.id || forcePinChange || activeTutorial) return undefined;
    const onboardingKey = `comunica_guided_onboarding_20261020_v1_${currentUser.id}`;
    if (localStorage.getItem(onboardingKey)) return undefined;
    const timer = window.setTimeout(() => {
      localStorage.setItem(onboardingKey, new Date().toISOString());
      setActiveTab('dashboard');
      setActiveTutorial('platform');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activeCompany?.id, activeTutorial, currentUser?.id, dbLoading, forcePinChange]);
  const servicesTourReleaseKey = currentUser?.id && activeCompany?.id
    ? `comunica_services_tour_20261023_v1_${activeCompany.id}_${currentUser.id}`
    : '';

  useEffect(() => {
    if (dbLoading || forcePinChange || activeTab !== 'services' || activeTutorial || !servicesTourReleaseKey) return undefined;
    if (localStorage.getItem(servicesTourReleaseKey)) return undefined;
    const timer = window.setTimeout(() => {
      setServiceWorkspace('requests');
      setServiceActivityView('list');
      setServiceActivityStatusFilter('active');
      setServiceActivityPeriodFilter('all');
      setActiveTutorial(current => current || 'services');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeTab, activeTutorial, dbLoading, forcePinChange, servicesTourReleaseKey]);

  const [authReady, setAuthReady] = useState(!isFirebaseAvailable);
  const [authScope, setAuthScope] = useState({ companyId: '', isDeveloper: false });
  const [pushToken, setPushToken] = useState('');
  const cloudActivityCountRef = useRef(0);
  const [cloudActivity, setCloudActivity] = useState({ count: 0, label: '' });
  const beginCloudActivity = (label) => {
    cloudActivityCountRef.current += 1;
    setCloudActivity({ count: cloudActivityCountRef.current, label });
  };
  const endCloudActivity = () => {
    cloudActivityCountRef.current = Math.max(0, cloudActivityCountRef.current - 1);
    setCloudActivity(previous => ({ count: cloudActivityCountRef.current, label: cloudActivityCountRef.current ? previous.label : '' }));
  };

  const loadSupportCompanyHealth = async (forceRefresh = false) => {
    if (!functionsClient || !dbUser || !currentUser?.isDeveloper || supportHealthLoading) return;
    setSupportHealthLoading(true);
    setSupportHealthError('');
    beginCloudActivity('Atualizando indicadores das empresas...');
    try {
      const response = await httpsCallable(functionsClient, 'platformCompanyHealth')({ forceRefresh });
      const payload = response.data && typeof response.data === 'object' ? response.data : {};
      setSupportCompanyHealth({
        generatedAt: Number(payload.generatedAt || Date.now()),
        companies: Array.isArray(payload.companies) ? payload.companies : [],
      });
    } catch (error) {
      console.error('Não foi possível carregar a saúde das empresas.', error);
      setSupportHealthError('Não foi possível atualizar os indicadores das empresas. Tente novamente.');
      if (forceRefresh) triggerNotification('Não foi possível atualizar os indicadores das empresas.', 'error');
    } finally {
      setSupportHealthLoading(false);
      endCloudActivity();
    }
  };

  useEffect(() => {
    if (activeTab !== 'support' || !dbUser || !currentUser?.isDeveloper || supportCompanyHealth.generatedAt) return;
    loadSupportCompanyHealth(false);
  }, [activeTab, dbUser, currentUser?.isDeveloper, supportCompanyHealth.generatedAt]);

  useEffect(() => {
    if (!isFirebaseAvailable || !authReady || !dbUser || currentUser?.id !== dbUser.uid) {
      setPlatformUpdates([]);
      setPlatformUpdateReadIds(new Set());
      return undefined;
    }
    const updatesPath = ['artifacts', appId, 'public', 'data'];
    const updatesRef = collection(db, ...updatesPath, 'platformUpdates');
    const readsRef = collection(db, ...updatesPath, 'platformUpdateReads', dbUser.uid, 'updates');
    const unsubscribeUpdates = onSnapshot(updatesRef, snapshot => {
      setPlatformUpdates(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
        .filter(item => item.published !== false)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
    }, error => console.error('Não foi possível carregar as novidades da plataforma.', error));
    const unsubscribeReads = onSnapshot(readsRef, snapshot => {
      setPlatformUpdateReadIds(new Set(snapshot.docs.map(item => item.id)));
    }, error => console.error('Não foi possível carregar as leituras das novidades.', error));
    return () => { unsubscribeUpdates(); unsubscribeReads(); };
  }, [authReady, dbUser, currentUser?.id]);

  const handlePlatformUpdateRead = async (updateId, destination) => {
    try {
      if (!platformUpdateReadIds.has(updateId) && isFirebaseAvailable && dbUser) {
        const readRef = doc(db, 'artifacts', appId, 'public', 'data', 'platformUpdateReads', dbUser.uid, 'updates', updateId);
        await setDoc(readRef, { userId: dbUser.uid, updateId, readAt: Date.now() });
        setPlatformUpdateReadIds(previous => new Set([...previous, updateId]));
      }
      if (destination) setActiveTab(destination);
    } catch (error) {
      console.error('Não foi possível registrar a leitura da novidade.', error);
      triggerNotification('Não foi possível registrar a leitura. Tente novamente.', 'error');
    }
  };

  const handleImprovePlatformUpdate = async (draft, tone) => {
    const instruction = 'Você é redator de produto de uma plataforma corporativa brasileira. Aprimore os textos para que sejam claros, convidativos e fáceis de ler. Não invente funcionalidades, prazos ou promessas; preserve o sentido. Escreva em português natural, sem Markdown, asteriscos, hashtags ou emojis em excesso. Retorne somente JSON válido com as propriedades titulo, resumo e conteudo.';
    const prompt = `Reescreva este aviso de novidade no tom ${tone}. Preserve o nome da ferramenta escolhida, se houver.\n\nTítulo: ${draft.title}\nResumo: ${draft.summary}\nConteúdo: ${draft.content}`;
    const response = await callGemini(prompt, instruction);
    const parsed = JSON.parse(String(response).replace(/```json/gi, '').replace(/```/g, '').trim());
    return {
      title: formatAIText(parsed.titulo || draft.title).replace(/\n/g, ' ').trim(),
      summary: formatAIText(parsed.resumo || draft.summary).replace(/\n/g, ' ').trim(),
      content: formatAIText(parsed.conteudo || draft.content),
    };
  };

  const handlePublishPlatformUpdate = async update => {
    if (!currentUser?.isDeveloper || !dbUser || !isFirebaseAvailable) throw new Error('A publicação está disponível somente para o suporte conectado à nuvem.');
    const updateRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'platformUpdates'));
    await setDoc(updateRef, { ...update, id: updateRef.id, authorId: dbUser.uid, authorName: currentUser.name || 'Suporte do Comunica', createdAt: Date.now(), published: true, targetCompanies: [] });
    triggerNotification('Novidade publicada para as empresas do Comunica.');
  };

  const handleArchivePlatformUpdate = async updateId => {
    if (!currentUser?.isDeveloper || !dbUser) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'platformUpdates', updateId), { published: false, archivedAt: Date.now() });
      triggerNotification('Novidade arquivada.');
    } catch (error) {
      console.error('Não foi possível arquivar a novidade.', error);
      triggerNotification('Não foi possível arquivar a novidade.', 'error');
    }
  };

  useEffect(() => {
    notificationDispatcher = (message, type) => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      setCustomNotification({ message, type });
      notificationTimerRef.current = setTimeout(() => setCustomNotification(null), 4200);
    };
    return () => {
      notificationDispatcher = null;
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (showAddParticipant) return setShowAddParticipant(false);
      if (showMsgSuggestions) return setShowMsgSuggestions(false);
      if (showMessagesModal || activeTab === 'inbox') {
        if (isComposingMsg) return setIsComposingMsg(false);
        if (activeThreadId) return setActiveThreadId(null);
        if (showMessagesModal) return setShowMessagesModal(false);
      }
      if (showSummaryModal) return setShowSummaryModal(false);
      if (serviceFormOpen) return setServiceFormOpen(false);
      if (showChangePinModal) return forcePinChange ? undefined : setShowChangePinModal(false);
      if (showControlCenter) return setShowControlCenter(false);
      if (showProfileModal) return setShowProfileModal(false);
      if (showProdModal) return setShowProdModal(false);
      if (showPresenceModal) return setShowPresenceModal(false);
      if (showAbsenceModal) return setShowAbsenceModal(false);
      if (showEventModal) return setShowEventModal(false);
      if (pendingContentDeletion && !isDeletingContent) return setPendingContentDeletion(null);
      if (pendingUserRemoval && !isRemovingUser) return setPendingUserRemoval(null);
      if (showUserModal) return setShowUserModal(false);
      if (showAnnModal) return setShowAnnModal(false);
      if (showDocumentModal) return setShowDocumentModal(false);
      if (engagementDetail) return setEngagementDetail(null);
      if (showPollModal) return setShowPollModal(false);
      if (showVacancyModal) return setShowVacancyModal(false);
      if (showPostModal) return setShowPostModal(false);
      if (showGoalModal) return setShowGoalModal(false);
      if (showCompanyRegistration) return setShowCompanyRegistration(false);
      if (isChatOpen) return setIsChatOpen(false);
      if (showNotificationsDropdown) return setShowNotificationsDropdown(false);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddParticipant, showMsgSuggestions, showMessagesModal, activeTab, isComposingMsg, activeThreadId, showSummaryModal, serviceFormOpen, showChangePinModal, forcePinChange, showControlCenter, showProfileModal, showProdModal, showPresenceModal, showAbsenceModal, showEventModal, pendingContentDeletion, isDeletingContent, pendingUserRemoval, isRemovingUser, showUserModal, showAnnModal, showDocumentModal, engagementDetail, showPollModal, showVacancyModal, showPostModal, showGoalModal, showCompanyRegistration, isChatOpen, showNotificationsDropdown, mobileMenuOpen]);

  // Refs para controle de Notificações em Segundo Plano
  const sessionStartTime = useRef(Date.now());
  const knownAnnIds = useRef(new Set());
  const knownPostIds = useRef(new Set());
  const isFirstRunNotif = useRef(true);
  const seenPushEventIds = useRef(new Set());

  const shouldDisplayPush = (eventId) => {
    if (!eventId) return true;
    if (seenPushEventIds.current.has(eventId)) return false;
    seenPushEventIds.current.add(eventId);
    if (seenPushEventIds.current.size > 100) {
      const [oldestEventId] = seenPushEventIds.current;
      seenPushEventIds.current.delete(oldestEventId);
    }
    return true;
  };

  const sendNativeNotification = async (title, body) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.png' });
      }

      // Solicita permissão do usuário (Obrigatório no Android 13+)
      const permStatus = await LocalNotifications.requestPermissions();

      if (permStatus.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Math.floor(Math.random() * 100000), // Gera um ID único para não sobrepor avisos
              schedule: { at: new Date(Date.now() + 1000) }, // Dispara em 1 segundo
            }
          ]
        });
      }
    } catch (e) {
      // O navegador não possui o plugin Capacitor; a notificação web acima continua funcionando.
      console.warn("Notificação nativa indisponível:", e);
    }
  };
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      .catch(error => console.error('Não foi possível preparar a instalação do Comunica.', error));
    return undefined;
  }, []);

  useEffect(() => {
    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
    const updateStandalone = () => setIsStandaloneApp(Boolean(standaloneQuery?.matches || window.navigator.standalone === true));
    const captureInstallPrompt = event => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const confirmInstallation = () => {
      setInstallPrompt(null);
      setIsStandaloneApp(true);
      setShowInstallHelp(false);
      triggerNotification('Comunica instalado com sucesso!');
    };
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', confirmInstallation);
    standaloneQuery?.addEventListener?.('change', updateStandalone);
    updateStandalone();
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', confirmInstallation);
      standaloneQuery?.removeEventListener?.('change', updateStandalone);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isStandaloneApp) {
      triggerNotification('O Comunica já está instalado neste dispositivo.');
      return;
    }
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice?.outcome !== 'accepted') setShowInstallHelp(true);
    } catch (error) {
      console.error('Não foi possível abrir a instalação do aplicativo.', error);
      setShowInstallHelp(true);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      triggerNotification('Este navegador não oferece notificações para o Comunica.', 'error');
      return;
    }
    const appleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (appleMobile && !window.navigator.standalone && !window.matchMedia?.('(display-mode: standalone)').matches) {
      triggerNotification('No iPhone, adicione o Comunica à Tela de Início e abra pelo ícone antes de ativar as notificações.', 'error');
      setShowInstallHelp(true);
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        triggerNotification('Permissão não concedida. Você pode ativá-la depois nas configurações de notificações do aparelho.', 'error');
        return;
      }
      setBrowserPushGranted(true);
      const messaging = getMessaging();
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration,
      });
      if (!token) throw new Error('O navegador não forneceu um token de notificação.');
      setPushToken(token);
      triggerNotification('Notificações ativadas neste dispositivo.');
    } catch (error) {
      console.error('Não foi possível ativar notificações neste dispositivo.', error);
      triggerNotification('Não foi possível ativar notificações. Confira a instalação, a permissão e tente novamente.', 'error');
    }
  };
// 1. Pede permissão e configura o Firebase Messaging (web e APK)
  useEffect(() => {
    let nativeListeners = [];
    let unsubscribeWebMessage = () => {};

    const configureNativeMessaging = async () => {
      try {
        const permission = await FirebaseMessaging.requestPermissions();
        if (permission.receive !== 'granted') return;

        const { token } = await FirebaseMessaging.getToken();
        if (token) setPushToken(token);

        nativeListeners = await Promise.all([
          FirebaseMessaging.addListener('tokenReceived', ({ token: renewedToken }) => {
            if (renewedToken) setPushToken(renewedToken);
          }),
          FirebaseMessaging.addListener('notificationReceived', ({ notification }) => {
            // No Android, a própria mensagem FCM já é exibida pelo sistema.
            // Não criamos uma segunda notificação dentro do aplicativo.
            const eventId = notification?.data?.eventId;
            if (shouldDisplayPush(eventId) && ['message_deadline', 'activity_deadline'].includes(notification?.data?.type)) {
              sendNativeNotification(notification.title || 'Prazo no Comunica', notification.body || 'Uma atividade exige sua atenção.');
            }
          }),
          FirebaseMessaging.addListener('notificationActionPerformed', ({ notification }) => {
            const type = notification?.data?.type;
            if (type === 'announcement') setActiveTab('announcements');
            if (type === 'sector_post') setActiveTab('sectors');
            if (type === 'sales_lead') setPendingSalesLeadId(notification?.data?.leadId || '');
            if (['message', 'message_deadline', 'activity_assignment', 'activity_update', 'activity_deadline'].includes(type)) {
              setPendingMessageNavigation({
                companyId: notification?.data?.companyId,
                threadId: notification?.data?.threadId,
                messageId: notification?.data?.messageId,
                activityId: notification?.data?.threadId ? '' : notification?.data?.messageId,
              });
            }
          }),
        ]);
      } catch (err) {
        console.warn('Não foi possível configurar as notificações nativas.', err);
      }
    };

    if (Capacitor.isNativePlatform()) {
      configureNativeMessaging();
      return () => nativeListeners.forEach((listener) => listener.remove());
    }

    if ('Notification' in window) {
      const configureWebMessaging = async () => {
        if (Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
        try {
          const messaging = getMessaging();
          const serviceWorkerRegistration = await navigator.serviceWorker.ready;
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration,
          });
          if (currentToken) setPushToken(currentToken);
          unsubscribeWebMessage = onMessage(messaging, (payload) => {
            const eventId = payload.data?.eventId || payload.messageId;
            if (shouldDisplayPush(eventId)) {
              triggerNotification(payload.notification?.title || 'Você recebeu uma nova notificação.', "success");
              if (['message_deadline', 'activity_assignment', 'activity_update', 'activity_deadline', 'sales_lead'].includes(payload.data?.type) && 'Notification' in window && Notification.permission === 'granted') {
                const desktopNotification = new Notification(payload.notification?.title || 'Atualização no Comunica', {
                  body: payload.notification?.body || 'Uma atividade exige sua atenção.',
                  icon: '/pwa/icon-192.png',
                  tag: eventId || `comunica-activity-${payload.data?.messageId || payload.data?.threadId || 'update'}`,
                });
                desktopNotification.onclick = () => {
                  window.focus();
                  if (payload.data?.type === 'sales_lead') setPendingSalesLeadId(payload.data?.leadId || '');
                  else setPendingMessageNavigation({companyId: payload.data?.companyId, threadId: payload.data?.threadId, messageId: payload.data?.messageId, activityId: payload.data?.threadId ? '' : payload.data?.messageId});
                  desktopNotification.close();
                };
              }
            }
          });
        } catch (error) {
          console.error('Erro ao configurar notificações do navegador.', error);
          triggerNotification('Não foi possível ativar notificações do navegador. Confira a permissão do site.', 'error');
        }
      };
      configureWebMessaging();
      }
    return () => {
      unsubscribeWebMessage();
      nativeListeners.forEach(listener => listener.remove());
    };
  }, [browserPushGranted]);

  useEffect(() => {
    if (!navigator.serviceWorker) return;
    const onWorkerMessage = event => {
      if (event.data?.type === 'comunica-open-message') {
        setPendingMessageNavigation({companyId: event.data.companyId, threadId: event.data.threadId, messageId: event.data.messageId});
      }
      if (event.data?.type === 'comunica-open-activity') {
        setPendingMessageNavigation({companyId: event.data.companyId, activityId: event.data.activityId});
      }
      if (event.data?.type === 'comunica-open-sales-lead') setPendingSalesLeadId(event.data.leadId || '');
    };
    navigator.serviceWorker.addEventListener('message', onWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onWorkerMessage);
  }, []);

  useEffect(() => {
    if (!pendingSalesLeadId || !dbUser || !currentUser?.isDeveloper) return;
    setActiveTab('support');
    setPendingSalesLeadId('');
    const url = new URL(window.location.href);
    url.searchParams.delete('supportLead');
    window.history.replaceState(window.history.state, '', url);
  }, [pendingSalesLeadId, dbUser, currentUser?.isDeveloper]);

  useEffect(() => {
    if (!pendingMessageNavigation || !dbUser || !currentUser) return;
    const {companyId, threadId, messageId, activityId} = pendingMessageNavigation;
    if (!/^[a-zA-Z0-9_-]+$/.test(companyId || '') || (!activityId && !/^[a-zA-Z0-9_-]+$/.test(threadId || ''))) {
      setPendingMessageNavigation(null);
      return;
    }
    let cancelled = false;
    const openMessage = async () => {
      try {
        const companySnapshot = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId));
        if (!companySnapshot.exists() || cancelled) return;
        setActiveCompany({id: companySnapshot.id, ...companySnapshot.data()});
        if (activityId) {
          setShowMessagesModal(false);
          setActiveThreadId(null);
          setServiceWorkspace('activities');
          setServiceActivityStatusFilter('all');
          setServiceActivityPeriodFilter('all');
          setActiveTab('services');
          return;
        }
        setIsComposingMsg(false);
        setActiveThreadId(threadId);
        setActivityMessageTargetId(messageId || '');
        if (messageId) setMessageFocusFilter('activities');
        setActiveTab('inbox');
      } catch (error) {
        console.error('Não foi possível abrir a conversa da notificação', error);
      } finally {
        if (!cancelled) {
          setPendingMessageNavigation(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('messageCompany');
          url.searchParams.delete('messageThread');
          url.searchParams.delete('messageId');
          url.searchParams.delete('activityCompany');
          url.searchParams.delete('activityId');
          window.history.replaceState(window.history.state, '', url);
        }
      }
    };
    openMessage();
    return () => { cancelled = true; };
  }, [pendingMessageNavigation, dbUser, currentUser?.id]);

  // Associa o dispositivo à conta autenticada sem recriar o suporte na equipe.
  const pushRegistrationInFlight = useRef(null);
  useEffect(() => {
    if (!pushToken || !currentUser || !isFirebaseAvailable || !dbUser) return;
    if (!currentUser.isDeveloper && !activeCompany) return;

    const savedTokens = Array.isArray(currentUser.pushTokens) ? currentUser.pushTokens : [];
    if (savedTokens.includes(pushToken)) return;
    if (pushRegistrationInFlight.current === pushToken) return;
    pushRegistrationInFlight.current = pushToken;
    const accountId = currentUser.id;
    const register = async () => {
      try {
        const saved = currentUser.isDeveloper
          ? Boolean((await httpsCallable(functionsClient, 'registerSupportPushToken')({token: pushToken})).data?.registered)
          : await updateDocField('users', accountId, {pushTokens: [...new Set([...savedTokens, pushToken])]});
        if (saved) setCurrentUser(previous => previous?.id === accountId
          ? {...previous, pushTokens: [...new Set([...(previous.pushTokens || []), pushToken])]}
          : previous);
      } catch (error) {
        console.error('Não foi possível registrar notificações neste dispositivo', error);
        triggerNotification('Não foi possível ativar notificações neste dispositivo.', 'error');
      } finally {
        if (pushRegistrationInFlight.current === pushToken) pushRegistrationInFlight.current = null;
      }
    };
    register();
  }, [pushToken, currentUser, activeCompany, dbUser, functionsClient]);

// 2. Monitora as coleções para disparar notificações apenas de itens NOVOS
  useEffect(() => {
    const canListenForNotifications = authReady && dbUser && currentUser?.id === dbUser.uid && activeCompany && (authScope.isDeveloper || authScope.companyId === activeCompany.id);
    if (!canListenForNotifications) {
      knownAnnIds.current.clear();
      knownPostIds.current.clear();
      return;
    }

    const unsubscribeAnn = onSnapshot(getTenantCollection('announcements'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;

          // A Firebase Function é a única responsável pelo push. Não exibimos
          // outro aviso pelo snapshot para evitar notificações em duplicidade.
          knownAnnIds.current.add(docId);
        }
      });
    });

    const unsubscribePosts = onSnapshot(getTenantCollection('posts'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;

          // O push chega pela Firebase Function e pelo listener de mensagens.
          knownPostIds.current.add(docId);
        }
      });
    });

    return () => {
      unsubscribeAnn();
      unsubscribePosts();
    };
  }, [authReady, authScope.companyId, authScope.isDeveloper, currentUser?.id, activeCompany, dbUser]);
  useEffect(() => {
    if (!isFirebaseAvailable) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (err) {
        console.error("Autenticação de banco em nuvem falhou", err);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      if (usr?.isAnonymous) {
        localStorage.removeItem('comunica_current_user');
        setCurrentUser(null);
        setDbUser(null);
        setAuthScope({ companyId: '', isDeveloper: false });
        setAuthReady(true);
        setDbLoading(false);
        await signOut(auth);
        return;
      }
      if (!usr) {
        // Não mantenha um perfil local quando a sessão do Firebase já expirou.
        localStorage.removeItem('comunica_current_user');
        localStorage.removeItem('comunica_active_company');
        setCurrentUser(null);
        setActiveCompany(null);
        setDbUser(null);
        setAuthScope({ companyId: '', isDeveloper: false });
        setAuthReady(true);
        setDbLoading(false);
        return;
      }
      try {
        const token = await usr.getIdTokenResult();
        const scope = { companyId: String(token.claims.companyId || ''), isDeveloper: token.claims.isDeveloper === true };
        const savedUser = getLocalStorageItem('comunica_current_user', null);
        const savedCompany = getLocalStorageItem('comunica_active_company', null);
        if (savedUser?.id && savedUser.id !== usr.uid || (!scope.isDeveloper && savedCompany?.id && scope.companyId !== savedCompany.id)) {
          localStorage.removeItem('comunica_current_user');
          localStorage.removeItem('comunica_active_company');
          setCurrentUser(null);
          setActiveCompany(null);
        }
        setAuthScope(scope);
        setDbUser(usr);
      } catch (error) {
        console.error('Não foi possível validar a sessão do Firebase', error);
        setDbUser(null);
        setAuthScope({ companyId: '', isDeveloper: false });
      } finally {
        setAuthReady(true);
        setDbLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseAvailable || !dbUser || !currentUser?.isDeveloper) return;
    return onSnapshot(getCompaniesCollection(), (snapshot) => {
      setCompanies(snapshot.docs.map(company => ({ id: company.id, ...company.data() })));
    });
  }, [dbUser, currentUser?.isDeveloper]);

  useEffect(() => {
    setSupportRequests({});
    setSupportLoadError(false);
    if (!isFirebaseAvailable || !dbUser || !currentUser?.isDeveloper) return;
    const stops = companies.map(company => onSnapshot(query(
      collection(db, 'artifacts', appId, 'public', 'data', 'companies', company.id, 'messages'),
      where('participants', 'array-contains', PLATFORM_SUPPORT.id)
    ), snapshot => {
      const threads = new Map();
      snapshot.docs.forEach(item => {
        const message = { ...item.data(), id: item.id };
        if (!message.threadId) return;
        const previous = threads.get(message.threadId);
        if (!previous || Number(message.timestamp || 0) > Number(previous.timestamp || 0)) threads.set(message.threadId, message);
      });
      setSupportRequests(previous => ({ ...previous, [company.id]: [...threads.values()] }));
    }, () => {
      setSupportLoadError(true);
      setSupportRequests(previous => ({ ...previous, [company.id]: [] }));
    }));
    return () => stops.forEach(stop => stop());
  }, [dbUser, currentUser?.isDeveloper, companies]);

  useEffect(() => {
    setSalesLeads([]);
    setSalesLeadError(false);
    if (!isFirebaseAvailable || !dbUser || !currentUser?.isDeveloper) return undefined;
    return onSnapshot(collection(db, '_platformSalesLeads'), snapshot => {
      setSalesLeads(snapshot.docs.map(item => ({id: item.id, ...item.data()})).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
    }, () => setSalesLeadError(true));
  }, [dbUser, currentUser?.isDeveloper]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('comunica_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('comunica_current_user');
  }, [currentUser]);

  useEffect(() => {
    if (activeCompany) localStorage.setItem('comunica_active_company', JSON.stringify(activeCompany));
    else localStorage.removeItem('comunica_active_company');
  }, [activeCompany]);

  useEffect(() => {
    const isMatchingSession = dbUser && currentUser?.id === dbUser.uid && activeCompany && (authScope.isDeveloper || authScope.companyId === activeCompany.id);
    if (!isFirebaseAvailable || !authReady || !isMatchingSession) {
      setDbLoading(false);
      return;
    }

    const getCollectionPath = (name) => getTenantCollection(name);

    const setupSync = (collectionName, initialData, setState, localKey) => {
      if (collectionName === 'productivity' && !currentUser?.isAdmin && !currentUser?.prodGroup && !/encarregado.*produ|produ.*encarregado/i.test(currentUser?.role || '')) {
        setState([]);
        setLocalStorageSafe(localKey, JSON.stringify([]));
        return () => {};
      }
      const colRef = getCollectionPath(collectionName);
      const canSeeAllSchedules = Boolean(currentUser?.isAdmin || currentUser?.isDeveloper);
      const ownScheduleDepartments = [...new Set(getUserDepts(currentUser).filter(Boolean).map(String))].slice(0, 30);
      if (collectionName === 'schedules' && !canSeeAllSchedules && !ownScheduleDepartments.length) {
        setState([]);
        setLocalStorageSafe(localKey, JSON.stringify([]));
        setScheduleCoverageSources(previous => ({ ...(previous.companyId === activeCompany.id ? previous : {}), companyId: activeCompany.id, schedules: 'ready' }));
        return () => {};
      }
      const canSeeAllSwapRequests = currentUser?.isAdmin || currentUser?.isDeveloper || /(coordenador|encarregado|supervis|diretor|gestor|gestao|rh)/i.test(currentUser?.role || '');
      const source = collectionName === 'messages' && dbUser.uid !== 'platform-support-francielton'
        ? query(colRef, or(where('participants', 'array-contains', dbUser.uid), where('senderId', '==', dbUser.uid), where('receiverId', '==', dbUser.uid)))
        : collectionName === 'schedules' && !canSeeAllSchedules
          ? query(colRef, where('dept', 'in', ownScheduleDepartments))
        : collectionName === 'scheduleSwapRequests' && !canSeeAllSwapRequests
          ? query(colRef, or(where('requesterId', '==', dbUser.uid), where('targetUserId', '==', dbUser.uid)))
        : colRef;
      const affectsCoverage = ['users', 'departments', 'schedules', 'absences'].includes(collectionName);
      return onSnapshot(source, { includeMetadataChanges: affectsCoverage }, (snapshot) => {
        if (affectsCoverage) setScheduleCoverageSources(previous => ({ ...(previous.companyId === activeCompany.id ? previous : {}), companyId: activeCompany.id, [collectionName]: snapshot.metadata.fromCache ? 'loading' : 'ready' }));
        if (!snapshot.empty) {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          list.sort((a, b) => {
            const getTime = (item) => {
              if (!item) return 0;
              const d = item.createdAt || item.timestamp || item.date;

              if (d) {
                if (typeof d.toDate === 'function') return d.toDate().getTime();
                if (d.seconds) return d.seconds * 1000;
                if (typeof d === 'number') return d;

                if (typeof d === 'string') {
                  if (d.includes('/')) {
                    const [dataPart, horaPart = '00:00:00'] = d.split(' ');
                    const [dia, mes, ano] = dataPart.split('/');
                    const parsedBR = new Date(`${ano}-${mes}-${dia}T${horaPart}`).getTime();
                    if (!isNaN(parsedBR)) return parsedBR;
                  }
                  const parsedISO = new Date(d).getTime();
                  if (!isNaN(parsedISO)) return parsedISO;
                }
              }

              if (item.id && item.id.includes('-')) {
                const num = parseInt(item.id.split('-')[1] || '0', 10);
                if (!isNaN(num) && num > 1600000000000) return num;
              }

              return 0;
            };

            return getTime(b) - getTime(a);
          });

          if (collectionName === 'users') {
            const publicProfiles = list.map(({pin: ignoredPin, ...profile}) => profile);
            setState(publicProfiles);
            setLocalStorageSafe(localKey, JSON.stringify(publicProfiles));
          } else {
            setState(list);
            setLocalStorageSafe(localKey, JSON.stringify(list));
          }
        } else {
          // Usuários nunca são repovoados automaticamente por dados de demonstração
          // ou migrações antigas. A empresa começa vazia somente quando isso é real.
          setState([]);
          setLocalStorageSafe(localKey, JSON.stringify([]));
        }
      }, () => {
        if (affectsCoverage) setScheduleCoverageSources(previous => ({ ...(previous.companyId === activeCompany.id ? previous : {}), companyId: activeCompany.id, [collectionName]: 'error' }));
        setState([]);
        setLocalStorageSafe(localKey, JSON.stringify([]));
        setDbLoading(false);
        triggerNotification('Não foi possível carregar ' + collectionName + '. Confira sua conexão e permissão.', 'error');
      });

    }; // 3. Faltava fechar a função setupSync principal

    // A partir daqui, você continua com as chamadas normais (dentro do seu useEffect):
    const unsubDepts = setupSync('departments', INITIAL_DEPARTMENTS, setDepartmentsList, 'comunica_departments');
    const unsubUsers = setupSync('users', INITIAL_USERS, setUsersList, 'comunica_users');
    const unsubRoles = setupSync('roles', INITIAL_ROLES, setRolesList, 'comunica_roles');
    const unsubAnn = setupSync('announcements', INITIAL_ANNOUNCEMENTS, setAnnouncements, 'comunica_announcements');
    const unsubPosts = setupSync('posts', INITIAL_SECTOR_POSTS, setSectorPosts, 'comunica_sector_posts');
    const unsubProd = setupSync('productivity', INITIAL_PRODUCTIVITY, setProductivityLogs, 'comunica_productivity');
    const unsubMessages = setupSync('messages', INITIAL_MESSAGES, setPrivateMessages, 'comunica_messages');
    const unsubActivities = setupSync('activities', [], setStandaloneActivities, 'comunica_activities');
    const unsubActivityTemplates = setupSync('activityTemplates', [], setActivityTemplates, 'comunica_activity_templates');
    const unsubEvents = setupSync('events', INITIAL_CALENDAR_EVENTS, setCalendarEvents, 'comunica_calendar_events');
    const unsubAbsences = setupSync('absences', INITIAL_ABSENCES, setAbsences, 'comunica_absences');
    const unsubSchedules = setupSync('schedules', [], setWorkSchedules, 'comunica_work_schedules');
    const unsubScheduleSwapRequests = setupSync('scheduleSwapRequests', [], setScheduleSwapRequests, 'comunica_schedule_swap_requests');
    const unsubPresence = setupSync('presence', INITIAL_PRESENCE, setPresenceList, 'comunica_presence');
    const unsubDocuments = () => {};
    const unsubPolls = setupSync('polls', [], setPollsList, 'comunica_polls');

setDbLoading(false);

    return () => {
      unsubDepts();
      unsubUsers();
      unsubRoles();
      unsubAnn();
      unsubPosts();
      unsubProd();
      unsubMessages();
      unsubActivities();
      unsubActivityTemplates();
      unsubEvents();
      unsubAbsences();
      unsubSchedules();
      unsubScheduleSwapRequests();
      unsubPresence();
      unsubDocuments();
      unsubPolls();
      unsubPosts();
      unsubProd();
      unsubMessages();
      unsubEvents();
      unsubAbsences();
      unsubSchedules();
      unsubScheduleSwapRequests();
      unsubPresence();
      unsubDocuments();
      unsubPolls();
    };
  }, [authReady, authScope.companyId, authScope.isDeveloper, dbUser, activeCompany, currentUser?.id, currentUser?.isAdmin, currentUser?.prodGroup, currentUser?.role]);

  useEffect(() => {
    setAccessControl({ sectorPermissions: {} });
    if (!isFirebaseAvailable || !dbUser || !activeCompany?.id) return;
    return onSnapshot(doc(getTenantCollection('settings'), 'access-control'), snapshot => {
      setAccessControl(snapshot.exists() ? { sectorPermissions: {}, ...snapshot.data() } : { sectorPermissions: {} });
    }, error => console.error('Falha ao carregar controle de acesso', error));
  }, [dbUser, activeCompany?.id]);

  useEffect(() => {
    const fallback = sanitizeServiceCatalogSettings({});
    setServiceCatalogSettings(fallback);
    if (!isFirebaseAvailable || !dbUser || !activeCompany?.id) return;
    return onSnapshot(doc(getTenantCollection('settings'), 'service-catalog'), snapshot => {
      setServiceCatalogSettings(sanitizeServiceCatalogSettings(snapshot.exists() ? snapshot.data() : {}));
    }, error => console.error('Falha ao carregar catálogo de serviços', error));
  }, [dbUser, activeCompany?.id]);


  useEffect(() => {
    setServiceManagementMessages([]);
    if (!isFirebaseAvailable || !dbUser || !activeCompany?.id || (!currentUser?.isAdmin && !currentUser?.isDeveloper)) return undefined;
    const snapshots = { requests: [], activities: [] };
    const publish = () => setServiceManagementMessages(
      [...new Map([...snapshots.requests, ...snapshots.activities].filter(Boolean).map(item => [item.id, item])).values()]
    );
    const messagesRef = getTenantCollection('messages');
    const stopRequests = onSnapshot(
      query(messagesRef, where('serviceRequest', '==', true)),
      snapshot => { snapshots.requests = snapshot.docs.map(item => ({ id: item.id, ...item.data() })); publish(); },
      error => console.error('Falha ao carregar demandas gerenciais', error),
    );
    const stopActivities = onSnapshot(
      query(messagesRef, where('activity.status', 'in', ['pending', 'in_progress', 'resolved'])),
      snapshot => { snapshots.activities = snapshot.docs.map(item => ({ id: item.id, ...item.data() })); publish(); },
      error => console.error('Falha ao carregar atividades gerenciais', error),
    );
    return () => { stopRequests(); stopActivities(); };
  }, [dbUser, activeCompany?.id, currentUser?.isAdmin, currentUser?.isDeveloper]);

  useEffect(() => {
    setAutomaticScheduleRules(sanitizeAutomaticScheduleRules({}));
    setAutomaticScheduleWeeklyHoursText('40:00');
    setScheduleCoverageReady(false);
    setScheduleCoverageError('');
    if (!isFirebaseAvailable || !dbUser || !activeCompany?.id) { setScheduleCoverageError('Conecte-se à empresa para consultar e configurar a cobertura.'); return; }
    return onSnapshot(doc(getTenantCollection('settings'), 'schedule-rules'), snapshot => {
      const rules = sanitizeAutomaticScheduleRules(snapshot.exists() ? snapshot.data() : {});
      setAutomaticScheduleRules(rules);
      setScheduleCoverageReady(true);
      setScheduleCoverageError('');
      const minutes = Math.round(rules.hoursPerWeek * 60);
      setAutomaticScheduleWeeklyHoursText(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
    }, error => { console.error('Falha ao carregar regras da escala', error); setScheduleCoverageReady(false); setScheduleCoverageError('Não foi possível carregar as necessidades da empresa. Atualize a página para tentar novamente.'); });
  }, [dbUser, activeCompany?.id]);

  useEffect(() => {
    setAuditLogs([]);
    if (!isFirebaseAvailable || !dbUser || !activeCompany?.id || (!currentUser?.isAdmin && !currentUser?.isDeveloper)) return;
    return onSnapshot(getTenantCollection('auditLogs'), snapshot => {
      const entries = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      entries.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
      setAuditLogs(entries.slice(0, 500));
    }, error => console.error('Falha ao carregar auditoria', error));
  }, [dbUser, activeCompany?.id, currentUser?.isAdmin, currentUser?.isDeveloper]);

  useEffect(() => {
    if (!isFirebaseAvailable || !authReady || !functionsClient || !dbUser || currentUser?.id !== dbUser.uid || !activeCompany?.id || (!authScope.isDeveloper && authScope.companyId !== activeCompany.id)) return;
    let cancelled = false;
    httpsCallable(functionsClient, 'listCompanyDocuments')({companyId: activeCompany.id})
      .then(result => {
        if (!cancelled) setDocumentsList(Array.isArray(result.data?.documents) ? result.data.documents : []);
      })
      .catch(error => {
        console.error('Falha ao carregar documentos autorizados', error);
        if (!cancelled) {
          setDocumentsList([]);
          triggerNotification('Não foi possível carregar os documentos autorizados.', 'error');
        }
      });
    return () => { cancelled = true; };
  }, [authReady, authScope.companyId, authScope.isDeveloper, activeCompany?.id, currentUser?.id, currentUser?.isAdmin, currentUser?.isDeveloper, dbUser]);

  useEffect(() => {
    setVacanciesList([]);
    setCareerApplications([]);
    if (!isFirebaseAvailable || !authReady || !dbUser || currentUser?.id !== dbUser.uid || !activeCompany || (!authScope.isDeveloper && authScope.companyId !== activeCompany.id) || !isCareerManagerUser(currentUser)) return;
    const stopVacancies = onSnapshot(getTenantCollection('vacancies'), snapshot =>
      setVacanciesList(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
    () => triggerNotification('Não foi possível carregar as vagas.', 'error'));
    const stopApplications = onSnapshot(getTenantCollection('applications'), snapshot =>
      setCareerApplications(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
    () => triggerNotification('Não foi possível carregar as candidaturas.', 'error'));
    return () => { stopVacancies(); stopApplications(); };
  }, [authReady, authScope.companyId, authScope.isDeveloper, dbUser, activeCompany, currentUser?.id, currentUser?.isAdmin, currentUser?.isDeveloper, currentUser?.role, currentUser?.dept, currentUser?.department]);

  useEffect(() => {
    if (activeTab !== 'careers' || !isCareerManagerUser(currentUser) || !activeCompany?.id || careerRetentionCompanyRef.current === activeCompany.id) return;
    careerRetentionCompanyRef.current = activeCompany.id;
    httpsCallable(functionsClient, 'initializeCareerRetention')({ companyId: activeCompany.id }).catch(error => {
      careerRetentionCompanyRef.current = '';
      console.error('Falha ao inicializar retenção dos currículos', error);
    });
  }, [activeTab, activeCompany?.id, currentUser?.id, currentUser?.isAdmin, currentUser?.isDeveloper, currentUser?.role, currentUser?.dept, currentUser?.department]);

  useEffect(() => {
    if (activeTab !== 'careers' || !careerApplications.length || !isCareerManagerUser(currentUser) || !activeCompany?.id) return;
    const due = careerApplications.filter(item => applicationRetentionMs(item) <= Date.now() + 15 * 24 * 60 * 60 * 1000).length;
    const noticeKey = `${activeCompany.id}-${new Date().toISOString().slice(0, 10)}-${due}`;
    if (!due || careerExpiryNoticeRef.current === noticeKey) return;
    careerExpiryNoticeRef.current = noticeKey;
    triggerNotification(`${due} currículo(s) estão vencidos ou expiram nos próximos 15 dias. Revise os prazos no Banco de Talentos.`, 'error');
  }, [activeTab, activeCompany?.id, careerApplications, currentUser?.id]);
  useEffect(() => {
    if (!isCareerManagerUser(currentUser) || !activeCompany?.id) return;
    const pending = careerApplications.filter(item => item.candidateUpdatePending === true).length;
    const noticeKey = `${activeCompany.id}-${pending}`;
    if (!pending || careerCandidateUpdateNoticeRef.current === noticeKey) return;
    careerCandidateUpdateNoticeRef.current = noticeKey;
    triggerNotification(`${pending} candidatura(s) em análise foram atualizadas pelo candidato. Revise o Banco de Talentos.`, 'error');
  }, [activeCompany?.id, careerApplications, currentUser?.id, currentUser?.isAdmin, currentUser?.role]);
const getStatusEmTempoReal = (colaborador) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. CHECAGEM DE FÉRIAS NO CALENDÁRIO
  // Blinda ID e checa se o motivo é férias, ignorando maiúsculas
  const feriasDoUser = absences.filter(abs => {
    const isMesmoUser = String(abs.userId) === String(colaborador.id) || String(abs.userName).toLowerCase() === String(colaborador.name).toLowerCase();
    const isFerias = abs.reason && abs.reason.trim().toLowerCase() === 'férias';
    return isMesmoUser && isFerias;
  });

  for (const abs of feriasDoUser) {
    let dataInicio = abs.startDate;
    let dataFim = abs.endDate;

    if (dataInicio && dataInicio.includes('/')) dataInicio = dataInicio.split('/').reverse().join('-');
    if (dataFim && dataFim.includes('/')) dataFim = dataFim.split('/').reverse().join('-');

    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim = new Date(dataFim + 'T23:59:59');

    // Se o dia de hoje estiver dentro do atestado, a pessoa está de férias AGORA
    if (hoje >= inicio && hoje <= fim) {
      return 'Férias';
    }
  }

  // 2. Escala planejada pelo gestor: vale somente dentro do período
  // indicado no calendário e não substitui férias vigentes.
  const plannedSchedule = workSchedules
    .filter(schedule => String(schedule.userId) === String(colaborador.id) &&
      todayStr >= schedule.startDate && todayStr <= schedule.endDate)
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))[0];
  if (plannedSchedule?.status) return plannedSchedule.status;

  // 3. BUSCA O STATUS DO DIA A DIA (Presencial, Home Office, Folga)
  // É AQUI QUE ESTAVA O ERRO! Precisamos olhar para a lista 'presenceList', e não para o perfil.
  const presencaDiaria = presenceList.find(p => String(p.name).toLowerCase() === String(colaborador.name).toLowerCase());

  if (presencaDiaria && presencaDiaria.status) {
    // Se achou na lista diária e não for 'Férias', retorna o status (ex: Home Office)
    if (presencaDiaria.status !== 'Férias') {
      return presencaDiaria.status;
    }
  }

  // 4. SEGURANÇA FINAL
  // Se não tem atestado de férias para hoje, nem status na lista diária, o padrão é Presencial.
  return 'Presencial';
};
  const uploadFileToStorage = async (file, folder, accessMetadata = {}, onProgress, onTask) => {
    beginCloudActivity('Enviando arquivo para a nuvem...');
    try {
      if (!file) throw new Error('Selecione um arquivo para enviar.');
      if (!storage || !activeCompany || !dbUser) throw new Error('Sessão de armazenamento indisponível.');
      const safeFileName = String(file.name || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-160);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeFileName}`;
      const performUpload = async (uploader, uploadStorage = storage) => {
        const fileRef = ref(uploadStorage, `companies/${activeCompany.id}/users/${uploader.uid}/${folder}/${uniqueName}`);
        const customMetadata = Object.fromEntries(Object.entries({ ownerUid: uploader.uid, ...accessMetadata })
          .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
          .map(([key, value]) => [key, String(value)]));
        const uploadTask = uploadBytesResumable(fileRef, file, { contentType: resolveUploadContentType(file), customMetadata });
        if (typeof onTask === 'function') onTask(uploadTask);
        const snapshot = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', current => {
            const progress = current.totalBytes > 0 ? Math.round((current.bytesTransferred / current.totalBytes) * 100) : 0;
            if (typeof onProgress === 'function') onProgress(progress);
          }, reject, () => resolve(uploadTask.snapshot));
        });
        return { url: await getDownloadURL(snapshot.ref), storagePath: snapshot.ref.fullPath };
      };

      beginCloudActivity('Validando sua sessão para o envio...');
      try {
        if (typeof onProgress === 'function') onProgress(0);
        if (!functionsClient) throw new Error('Serviço de autorização de arquivos indisponível.');
        // Confere no servidor, em tempo real, se o colaborador continua ativo e
        // recebe uma autorização curta, vinculada somente a este arquivo. Uma
        // instância temporária evita substituir a sessão corporativa principal.
        const verifyUploadAccess = httpsCallable(functionsClient, 'refreshUploadSession');
        const uploadContentType = resolveUploadContentType(file);
        const authorization = await verifyUploadAccess({
          appId,
          companyId: activeCompany.id,
          folder,
          fileName: uniqueName,
          size: file.size,
          contentType: uploadContentType,
        });
        const uploadToken = authorization.data?.token;
        if (!uploadToken) throw new Error('O servidor não liberou uma sessão segura para o arquivo.');

        const uploadApp = initializeApp(firebaseConfig, `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
        try {
          const uploadAuth = getAuth(uploadApp);
          await setPersistence(uploadAuth, inMemoryPersistence);
          const uploadCredential = await signInWithCustomToken(uploadAuth, uploadToken);
          const isolatedStorage = getStorage(uploadApp);
          isolatedStorage.maxUploadRetryTime = 30 * 60 * 1000;
          return await performUpload(uploadCredential.user, isolatedStorage);
        } finally {
          await deleteApp(uploadApp).catch(error => console.warn('Não foi possível encerrar a sessão temporária de upload.', error));
        }
      } finally {
        endCloudActivity();
      }
    } finally {
      endCloudActivity();
    }
  };

  const deleteStoredFile = async (file) => {
    const location = file?.storagePath || file?.data || file?.url || '';
    if (!location || !storage) return true;
    try {
      await deleteObject(ref(storage, location));
      return true;
    } catch (error) {
      if (String(error?.code || '').includes('object-not-found')) return true;
      console.error('Não foi possível remover o arquivo físico:', error);
      return false;
    }
  };

  const handleImageUpload = async (e, setFormState, fieldName = 'image') => {
    const input = e.currentTarget;
    try {
      const file = input.files?.[0];
      if (!file) return;

      const contentType = resolveUploadContentType(file);
      if (!contentType.startsWith('image/')) throw new Error('Selecione um arquivo de imagem válido.');
      if (file.size > IMAGE_FILE_MAX_BYTES) throw new Error('A imagem ultrapassa o limite seguro de 25 MB.');

      triggerNotification('Enviando imagem para a nuvem...');
      const uploaded = await uploadFileToStorage(file, fieldName === 'avatar' ? 'avatars' : 'images');
      if (uploaded?.url) {
        setFormState(prev => ({ ...prev, [fieldName]: uploaded.url }));
        triggerNotification('Imagem salva na nuvem com sucesso!');
        return;
      }

      throw new Error('Armazenamento de imagens indisponível.');
    } catch (err) {
      console.error('Erro no envio da imagem:', err);
      const directMessage = String(err?.message || '');
      triggerNotification(directMessage.startsWith('Selecione') || directMessage.includes('25 MB') ? directMessage : fileUploadErrorMessage(err), 'error');
    } finally {
      if (input) input.value = '';
    }
  };

  const getCompaniesCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'companies');
  const getTenantCollection = (name) => activeCompany
    ? collection(db, 'artifacts', appId, 'public', 'data', 'companies', activeCompany.id, name)
    : null;

  const recordAuditEvent = async ({ action, collectionName, documentId, fields = [] }) => {
    if (!isFirebaseAvailable || !dbUser || !activeCompany?.id || collectionName === 'auditLogs') return;
    try {
      await addDoc(getTenantCollection('auditLogs'), {
        actorId: currentUser?.id || dbUser.uid,
        actorName: currentUser?.name || 'Usuário autenticado',
        actorRole: currentUser?.role || (currentUser?.isDeveloper ? 'Suporte da plataforma' : 'Colaborador'),
        action,
        collection: collectionName,
        documentId,
        fields: fields.filter(field => field !== 'pin' && field !== 'pushTokens').slice(0, 30),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Não foi possível registrar a auditoria', error);
    }
  };

  const saveDoc = async (colName, docId, data) => {
    const controlledCollections = ['announcements', 'posts', 'documents', 'polls', 'productivity', 'events', 'absences', 'presence', 'schedules', 'vacancies', 'departments', 'roles', 'activities', 'activityTemplates'];
    const accessUser = typeof currentUser === 'undefined' ? null : currentUser;
    const accessProfile = typeof effectiveAccessProfile === 'undefined' ? { canEdit: true, canManageCalendar: true } : effectiveAccessProfile;
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && controlledCollections.includes(colName) && accessProfile.canEdit === false) {
      triggerNotification('Seu perfil possui acesso apenas para consulta nesta área.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && colName === 'activities' && accessProfile.canManageActivities === false) {
      triggerNotification('Seu perfil não possui permissão para administrar atividades.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && colName === 'activityTemplates' && accessProfile.canManageActivityTemplates !== true) {
      triggerNotification('Seu perfil não possui permissão para administrar modelos de checklist.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && ['events', 'absences', 'presence', 'schedules'].includes(colName) && accessProfile.canManageCalendar === false) {
      triggerNotification('Seu perfil não possui permissão para alterar escalas ou calendário.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && colName === 'settings' && docId === 'schedule-rules' && accessProfile.canManageScheduleRules === false) {
      triggerNotification('Seu perfil não possui permissão para configurar conjuntos e regras da escala inteligente.', 'error');
      return false;
    }
    if (!isFirebaseAvailable || !dbUser) {
      triggerNotification('Conexão com a nuvem indisponível. Nada foi salvo; tente novamente.', 'error');
      return false;
    }
    const finishActivity = typeof beginCloudActivity === 'function' ? (beginCloudActivity('Salvando alteração...'), endCloudActivity) : () => {};
    try {
      const tenantCollection = getTenantCollection(colName);
      if (!tenantCollection) throw new Error('Nenhuma empresa selecionada.');
      const payload = {...data};
      if (colName === 'users') delete payload.pin;
      await setDoc(doc(tenantCollection, docId), payload, { merge: true });
      if (typeof recordAuditEvent === 'function') await recordAuditEvent({ action: 'record.saved', collectionName: colName, documentId: docId, fields: Object.keys(payload) });
      return true;
    } catch (err) {
      console.error("Database mutation error on cloud", err);
      triggerNotification('Não foi possível salvar na nuvem. Nenhuma alteração foi confirmada.', 'error');
      return false;
    } finally {
      finishActivity();
    }
  };

  const saveRelatedRecords = async (records, failureMessage = 'Não foi possível publicar. Nenhum dos registros desta operação foi salvo. Seu formulário foi preservado.', scheduleGuard = null) => {
    const finishActivity = typeof beginCloudActivity === 'function' ? (beginCloudActivity('Publicando informações...'), endCloudActivity) : () => {};
    try {
      if (!isFirebaseAvailable || !dbUser) throw new Error('Sessão indisponível.');
      if (scheduleGuard) {
        if (scheduleGuard.companyId !== activeCompany?.id || !records.length || records.some(record => record.collection !== 'schedules')) throw new Error('Publicação de escala inválida.');
        assertSchedulePublicationSize(records, scheduleGuard.replaced);
        const schedulesCollection = getTenantCollection('schedules');
        const fresh = await getDocsFromServer(scopedScheduleSource(schedulesCollection, scheduleScope, { query, where }));
        const currentSchedules = fresh.docs.map(item => ({ id: item.id, ...item.data() }));
        if (scheduleSignature(currentSchedules) !== scheduleSignature(scheduleGuard.history)) throw Object.assign(new Error('Escalas alteradas durante a revisão'), { code: 'planning-stale' });
        await runTransaction(db, async transaction => {
          const checks = await Promise.all(scheduleGuard.replaced.map(item => transaction.get(doc(schedulesCollection, item.id))));
          if (checks.some((snapshot, index) => !snapshot.exists() || scheduleSignature([{ id: snapshot.id, ...snapshot.data() }]) !== scheduleSignature([scheduleGuard.replaced[index]]))) throw Object.assign(new Error('Uma escala foi alterada durante a publicação'), { code: 'planning-stale' });
          for (const record of records) {
            const reference = doc(schedulesCollection, record.id);
            if (record.operation === 'delete') transaction.delete(reference);
            else transaction.set(reference, record.data);
          }
        });
      } else await commitAtomicRecords(records, () => writeBatch(db), (collectionName, id) => {
        const target = getTenantCollection(collectionName);
        if (!target) throw new Error('Nenhuma empresa selecionada.');
        return doc(target, id);
      });
      if (typeof recordAuditEvent === 'function') {
        await Promise.all(records.map(record => recordAuditEvent({
          action: record.operation === 'delete' ? 'record.deleted' : record.operation === 'update' ? 'record.updated' : 'record.created',
          collectionName: record.collection,
          documentId: record.id,
          fields: Object.keys(record.data || {}),
        })));
      }
      return true;
    } catch (error) {
      console.error('Falha na gravação conjunta', error);
      triggerNotification(schedulePublicationError(error, failureMessage), 'error');
      return false;
    } finally {
      finishActivity();
    }
  };

  const updateDocField = async (colName, docId, data) => {
    const controlledCollections = ['announcements', 'posts', 'documents', 'polls', 'productivity', 'events', 'absences', 'presence', 'schedules', 'vacancies', 'departments', 'roles', 'activities', 'activityTemplates'];
    const accessUser = typeof currentUser === 'undefined' ? null : currentUser;
    const accessProfile = typeof effectiveAccessProfile === 'undefined' ? { canEdit: true, canManageCalendar: true } : effectiveAccessProfile;
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && controlledCollections.includes(colName) && accessProfile.canEdit === false) {
      triggerNotification('Seu perfil possui acesso apenas para consulta nesta área.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && colName === 'activities' && accessProfile.canManageActivities === false) {
      triggerNotification('Seu perfil não possui permissão para administrar atividades.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && colName === 'activityTemplates' && accessProfile.canManageActivityTemplates !== true) {
      triggerNotification('Seu perfil não possui permissão para administrar modelos de checklist.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && ['events', 'absences', 'presence', 'schedules'].includes(colName) && accessProfile.canManageCalendar === false) {
      triggerNotification('Seu perfil não possui permissão para alterar escalas ou calendário.', 'error');
      return false;
    }
    const finishActivity = typeof beginCloudActivity === 'function' ? (beginCloudActivity('Atualizando informação...'), endCloudActivity) : () => {};
    try {
      if (!isFirebaseAvailable || !dbUser) throw new Error('Sessão indisponível.');
      const tenantCollection = getTenantCollection(colName);
      if (!tenantCollection) throw new Error('Nenhuma empresa selecionada.');
      await updateDoc(doc(tenantCollection, docId), data);
      if (typeof recordAuditEvent === 'function') await recordAuditEvent({ action: 'record.updated', collectionName: colName, documentId: docId, fields: Object.keys(data || {}) });
      return true;
    } catch (error) {
      console.error('Falha ao atualizar na nuvem', error);
      const errorCode = String(error?.code || '');
      triggerNotification(
        errorCode.includes('permission-denied')
          ? 'Seu perfil ainda não recebeu permissão para esta ação. Atualize a página, entre novamente e tente outra vez.'
          : 'Não foi possível confirmar a alteração na nuvem. Tente novamente.',
        'error',
      );
      return false;
    } finally {
      finishActivity();
    }
  };

  const removeDoc = async (colName, docId) => {
    const controlledCollections = ['announcements', 'posts', 'documents', 'polls', 'productivity', 'events', 'absences', 'presence', 'schedules', 'vacancies', 'departments', 'roles', 'activities', 'activityTemplates'];
    const accessUser = typeof currentUser === 'undefined' ? null : currentUser;
    const accessProfile = typeof effectiveAccessProfile === 'undefined' ? { canEdit: true, canManageCalendar: true } : effectiveAccessProfile;
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && controlledCollections.includes(colName) && accessProfile.canEdit === false) {
      triggerNotification('Seu perfil possui acesso apenas para consulta nesta área.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && colName === 'activities' && accessProfile.canManageActivities === false) {
      triggerNotification('Seu perfil não possui permissão para administrar atividades.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && colName === 'activityTemplates' && accessProfile.canManageActivityTemplates !== true) {
      triggerNotification('Seu perfil não possui permissão para administrar modelos de checklist.', 'error');
      return false;
    }
    if (accessUser && !accessUser.isAdmin && !accessUser.isDeveloper && ['events', 'absences', 'presence', 'schedules'].includes(colName) && accessProfile.canManageCalendar === false) {
      triggerNotification('Seu perfil não possui permissão para alterar escalas ou calendário.', 'error');
      return false;
    }
    const finishActivity = typeof beginCloudActivity === 'function' ? (beginCloudActivity('Removendo informação...'), endCloudActivity) : () => {};
    try {
      if (!isFirebaseAvailable || !dbUser) throw new Error('Sessão indisponível.');
      const tenantCollection = getTenantCollection(colName);
      if (!tenantCollection) throw new Error('Nenhuma empresa selecionada.');
      await deleteDoc(doc(tenantCollection, docId));
      if (typeof recordAuditEvent === 'function') await recordAuditEvent({ action: 'record.deleted', collectionName: colName, documentId: docId });
      return true;
    } catch (error) {
      console.error('Falha ao excluir na nuvem', error);
      triggerNotification('Não foi possível confirmar a exclusão. Verifique sua conexão e permissão.', 'error');
      return false;
    } finally {
      finishActivity();
    }
  };

  const handleCompanyRegistration = async (e) => {
    e.preventDefault();
    if (!currentUser?.isDeveloper) {
      triggerNotification('O cadastro de empresas está disponível apenas no suporte da plataforma.', 'error');
      return;
    }
    const code = companyForm.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!companyForm.name.trim() || !code || !companyForm.adminName.trim() || companyForm.adminPin.length !== 4) {
      triggerNotification('Preencha os dados da empresa e um PIN de 4 dígitos para o administrador.', 'error');
      return;
    }
    try {
      if (isFirebaseAvailable && functionsClient) {
        const createCompany = httpsCallable(functionsClient, 'registerCompany');
        const response = await createCompany({ appId, name: companyForm.name.trim(), code, adminName: companyForm.adminName.trim(), adminPin: companyForm.adminPin });
        const company = response.data.company;
        setCompanies(previous => [...previous.filter(item => item.id !== company.id), company]);
      } else {
        throw new Error('Serviço de autenticação indisponível.');
      }
      setCompanyForm({ name: '', code: '', adminName: '', adminPin: '' });
      setShowCompanyRegistration(false);
      triggerNotification('Empresa cadastrada e administrador criado com sucesso! Você permanece no suporte da plataforma.');
    } catch (error) {
      console.error('Erro ao cadastrar empresa', error);
      triggerNotification('Não foi possível cadastrar a empresa. Tente novamente.', 'error');
    }
  };

  const handleMigrateLegacyUsers = async () => {
    if (!currentUser?.isAdmin || activeCompany?.code !== '082026') {
      triggerNotification('A migração só pode ser feita pelo administrador da empresa 082026.', 'error');
      return;
    }
    if (!isFirebaseAvailable || !dbUser) {
      triggerNotification('A migração requer conexão com o banco de dados.', 'error');
      return;
    }

    try {
      const migrationRef = doc(getTenantCollection('settings'), 'legacy-migration');
      const migrationSnapshot = await getDoc(migrationRef);
      if (migrationSnapshot.exists() && migrationSnapshot.data()?.completedAt) {
        triggerNotification('A migração desta empresa já foi concluída. Os dados atuais foram preservados.', 'success');
        return;
      }

      const collectionsToMigrate = ['users', 'departments', 'roles', 'announcements', 'posts', 'productivity', 'messages', 'events', 'absences', 'presence', 'schedules'];
      let migrated = 0;

      for (const collectionName of collectionsToMigrate) {
        const legacySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', collectionName));
        const tenantSnapshot = await getDocs(getTenantCollection(collectionName));
        const existingIds = new Set(tenantSnapshot.docs.map(item => item.id));

        for (const legacyItem of legacySnapshot.docs) {
          if (existingIds.has(legacyItem.id)) continue;
          const data = { id: legacyItem.id, ...legacyItem.data() };
          if (collectionName === 'users') {
            data.companyId = activeCompany.id;
            data.updatedAt = data.updatedAt || Date.now();
            data.legacyMigratedAt = Date.now();
          }
          await setDoc(doc(getTenantCollection(collectionName), legacyItem.id), data);
          migrated += 1;
        }
      }

      await setDoc(migrationRef, { completedAt: Date.now(), migratedBy: currentUser.id, migratedRecords: migrated });

      triggerNotification(`${migrated} registro(s) migrado(s) para a empresa 082026.`, 'success');
    } catch (error) {
      console.error('Erro ao migrar colaboradores', error);
      triggerNotification('Não foi possível migrar os colaboradores. Tente novamente.', 'error');
    }
  };

  const handleCompanyCodeChange = async (value) => {
    const normalizedCode = value.toUpperCase().trim();
    const requestId = ++companyLookupRequestRef.current;
    setCompanyCode(normalizedCode);
    setLoginSelectedUserId('');
    setLoginSearchText('');
    setLoginError('');
    setActiveCompany(null);
    setUsersList([]);

    if (!normalizedCode || normalizedCode.length < 3) {
      return;
    }
    try {
      if (isFirebaseAvailable && functionsClient) {
        const getDirectory = httpsCallable(functionsClient, 'getLoginDirectory');
        const response = await getDirectory({ appId, companyCode: normalizedCode });
        if (requestId !== companyLookupRequestRef.current) return;
        const { company, users } = response.data;
        setActiveCompany(company);
        setUsersList(users);
        setCompanies(previous => [...previous.filter(item => item.id !== company.id), company]);
      } else {
        const company = companies.find(item => item.code === normalizedCode);
        if (requestId !== companyLookupRequestRef.current || !company) return;
        setActiveCompany(company);
      }
    } catch {
      if (requestId !== companyLookupRequestRef.current) return;
      setActiveCompany(null);
      setUsersList([]);
    }
  };

  const handleUserLoginSubmit = async (e) => {
    e.preventDefault();

    let company = activeCompany;
    let companyUsers = usersList;

    if (!company) {
      setLoginError('Empresa não encontrada. Confira o código informado.');
      return;
    }

    let selectedEmployee = null;
    if (loginSelectedUserId) {
      selectedEmployee = companyUsers.find(u => u.id === loginSelectedUserId);
    } else if (loginSearchText.trim()) {
      // Tenta achar pelo nome digitado de forma idêntica
      selectedEmployee = companyUsers.find(u => u.name.toLowerCase() === loginSearchText.trim().toLowerCase());
    }

    if (!selectedEmployee) {
      setLoginError('Colaborador não encontrado. Por favor, digite seu nome e clique em uma das opções sugeridas.');
      return;
    }

    try {
      if (!isFirebaseAvailable || !functionsClient) throw new Error('Serviço de autenticação indisponível.');
      const authenticate = httpsCallable(functionsClient, 'authenticateWithPin');
      const response = await authenticate({ appId, companyCode: company.code, userId: selectedEmployee.id, pin: loginPin });
      const session = response.data;
      await authPersistenceReady;
      await signInWithCustomToken(auth, session.token);
      setActiveCompany(session.company);
      setCurrentUser({ ...session.user, mustChangePin: session.requiresPinChange === true });
      if (session.requiresPinChange === true) {
        setCurrentPinInput(loginPin);
        setNewPinInput('');
        setConfirmNewPinInput('');
        setForcePinChange(true);
        setShowChangePinModal(true);
      }
      setLoginPin('');
      setLoginSearchText('');
      setLoginSelectedUserId('');
      setLoginError('');
      triggerNotification(`Bem-vindo, ${session.user.name}! Sessão iniciada de forma segura.`);
    } catch (error) {
      console.error('Falha no login seguro', error);
      setLoginError(loginErrorMessage(error));
    }
  };

  const handleDeveloperLogin = async (event) => {
    event.preventDefault();
    const developerName = 'FRANCIELTON LIMA NUNES';
    try {
      if (!functionsClient) throw new Error('Serviço de autenticação indisponível.');
      const developerLogin = httpsCallable(functionsClient, 'authenticateDeveloper');
      const response = await developerLogin({ appId, pin: developerPin, name: developerName });
      const session = response.data;
      await authPersistenceReady;
      await signInWithCustomToken(auth, session.token);
      setActiveCompany(session.company);
      setCurrentUser(session.user);
      setActiveTab('support');
      setDeveloperPin('');
      setShowDeveloperLogin(false);
      triggerNotification('Acesso de suporte iniciado.');
    } catch (error) {
      console.error('Erro no acesso de desenvolvedor:', error);
      setLoginError(loginErrorMessage(error, true));
    }
  };

  const handleUserLogout = () => {
    if (auth) signOut(auth).catch(error => console.error('Falha ao encerrar sessão Firebase', error));
    setCurrentUser(null);
    setActiveCompany(null);
    setCompanyCode('');
    localStorage.removeItem('comunica_active_company');
    setLoginSelectedUserId('');
    setLoginSearchText('');
    setActiveTab('dashboard');
    triggerNotification('Sessão encerrada com segurança.');
  };

  const requestOwnPinChange = async () => {
    if (pinChangeInFlight.current) return pinChangeInFlight.current;
    if (!functionsClient || !dbUser || !isFirebaseAvailable) {
      triggerNotification('Conecte-se e entre novamente para alterar o PIN.', 'error');
      return false;
    }
    if (!/^\d{4}$/.test(currentPinInput)) {
      triggerNotification('Informe corretamente o seu PIN atual de quatro números.', 'error');
      return false;
    }
    if (!/^\d{4}$/.test(newPinInput) || newPinInput !== confirmNewPinInput) {
      triggerNotification('Informe um PIN de quatro números e confirme o mesmo PIN.', 'error');
      return false;
    }
    const operation = (async () => {
      setIsChangingPin(true);
      try {
        await dbUser.getIdToken(true);
        const response = await httpsCallable(functionsClient, 'changeOwnPin')({
          appId, currentPin: currentPinInput, newPin: newPinInput
        });
        if (response.data?.changed !== true) throw new Error('Alteração não confirmada');
        setCurrentUser(previous => {
          const { pin: ignoredPin, ...profile } = previous;
          return { ...profile, mustChangePin: false };
        });
        setForcePinChange(false);
        return true;
      } catch (error) {
        console.error('Falha ao alterar o PIN do próprio usuário', error);
        const code = String(error?.code || '');
        const message = code.includes('resource-exhausted')
          ? 'Muitas tentativas. Aguarde 30 segundos antes de tentar novamente.'
          : code.includes('permission-denied')
            ? 'O PIN atual informado não confere. Revise os quatro números e tente novamente.'
            : code.includes('unauthenticated')
              ? 'Sua sessão expirou. Entre novamente antes de alterar o PIN.'
              : code.includes('aborted') || code.includes('failed-precondition')
                ? 'O PIN foi alterado em outra tentativa. Entre novamente usando o novo PIN.'
                : code.includes('unavailable') || code.includes('deadline-exceeded') || code.includes('internal')
                  ? 'O serviço de segurança está temporariamente indisponível. Aguarde alguns segundos e tente novamente.'
                  : 'Não foi possível alterar o PIN. Tente novamente; se persistir, acione o suporte da plataforma.';
        triggerNotification(message, 'error');
        return false;
      } finally {
        setIsChangingPin(false);
      }
    })();
    pinChangeInFlight.current = operation;
    try {
      return await operation;
    } finally {
      pinChangeInFlight.current = null;
    }
  };

  const handleChangePinSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !await requestOwnPinChange()) return;
    setShowChangePinModal(false);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmNewPinInput('');
    triggerNotification('Seu PIN de segurança foi atualizado com sucesso!');
  };

  const handleMyProfileSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (showPinFieldsInProfile && (currentPinInput || newPinInput || confirmNewPinInput)) {
      if (!await requestOwnPinChange()) return;
    }

    const { pin: ignoredPin, ...publicProfile } = currentUser;
    const updatedUser = {
      ...publicProfile,
      avatar: currentUser.isAdmin ? myProfileForm.avatar : currentUser.avatar,
      emergencyName: myProfileForm.emergencyName,
      emergencyPhone: myProfileForm.emergencyPhone,
      emergencyRelationship: myProfileForm.emergencyRelationship
    };

    if (isFirebaseAvailable && dbUser) {
      if (!await saveDoc('users', currentUser.id, updatedUser)) return;
    } else {
      setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }

    setCurrentUser(updatedUser);
    setShowProfileModal(false);

    // Resetar campos de senha após salvar
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmNewPinInput('');
    setShowPinFieldsInProfile(false);

    triggerNotification('Seu perfil e dados de acesso foram atualizados!');
  };

  const handleLikeAnnouncement = async (id) => {
    if (!currentUser) return;
    const ann = announcements.find(a => a.id === id);
    if (!ann) return;

    const hasLiked = ann.likedBy?.includes(currentUser.id);
    const updatedLikes = hasLiked ? ann.likes - 1 : ann.likes + 1;
    const updatedLikedBy = hasLiked
      ? ann.likedBy.filter(uid => uid !== currentUser.id)
      : [...(ann.likedBy || []), currentUser.id];

    if (isFirebaseAvailable && dbUser) {
      if (!await updateDocField('announcements', id, { likes: updatedLikes, likedBy: updatedLikedBy })) return;
    } else {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, likes: updatedLikes, likedBy: updatedLikedBy } : a));
    }
  };

  const handleConfirmAnnouncementRead = async (announcement) => {
    if (!currentUser || (announcement.readBy || []).includes(currentUser.id)) return;
    const readBy = [...new Set([...(announcement.readBy || []), currentUser.id])];
    if (isFirebaseAvailable && dbUser) {
      if (!await updateDocField('announcements', announcement.id, { readBy: arrayUnion(currentUser.id) })) return;
    } else {
      setAnnouncements(previous => previous.map(item => item.id === announcement.id ? { ...item, readBy } : item));
    }
    triggerNotification('Leitura confirmada.');
  };

  const handleDocumentFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > DOCUMENT_FILE_MAX_BYTES) {
      triggerNotification('O arquivo excede 50 MB. Reduza o tamanho e tente novamente.', 'error');
      event.target.value = '';
      return;
    }
    if (!isSupportedBusinessFile(file)) {
      triggerNotification('Formato não aceito. Envie PDF, Word, Excel, PowerPoint, texto, imagem, áudio ou vídeo.', 'error');
      event.target.value = '';
      return;
    }
    setIsUploadingDocument(true);
    setDocumentUploadProgress(0);
    try {
      triggerNotification('Enviando documento para a nuvem...');
      const documentId = newDocument.id || `document-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const uploaded = await uploadFileToStorage(
        file,
        'documents',
        { documentId },
        setDocumentUploadProgress,
        task => { documentUploadTask.current = task; },
      );
      if (!uploaded?.url) throw new Error('Arquivo sem URL');
      const previousFile = newDocument.file;
      setNewDocument(previous => ({ ...previous, id: documentId, file: {
        name: file.name,
        type: resolveUploadContentType(file),
        data: uploaded.url,
        storagePath: uploaded.storagePath,
      } }));
      if (previousFile) await deleteStoredFile(previousFile);
      triggerNotification('Documento anexado com sucesso.');
    } catch (error) {
      console.error('Erro ao anexar documento:', error);
      triggerNotification(fileUploadErrorMessage(error), 'error');
    } finally {
      documentUploadTask.current = null;
      setIsUploadingDocument(false);
      // Permite selecionar novamente o mesmo arquivo depois de uma falha.
      event.target.value = '';
    }
  };

  const handleSaveDocument = async (event) => {
    event.preventDefault();
    if (documentSaveInFlight.current || isUploadingDocument) return;
    if (!newDocument.title.trim() || !newDocument.file) return;
    const id = newDocument.id || `document-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (newDocument.accessMode === 'department' && newDocument.dept === 'all') {
      triggerNotification('Selecione o setor que poderá acessar este documento.', 'error');
      return;
    }
    if (newDocument.accessMode === 'people' && !newDocument.allowedUserIds.length) {
      triggerNotification('Selecione ao menos um colaborador para este documento.', 'error');
      return;
    }
    const documentData = {
      id,
      title: newDocument.title.trim(),
      description: newDocument.description.trim(),
      dept: newDocument.dept,
      accessMode: newDocument.accessMode,
      allowedUserIds: newDocument.accessMode === 'people' ? newDocument.allowedUserIds : [],
      category: newDocument.category || 'Geral',
      folder: normalizeDocumentFolder(newDocument.folder),
      tags: newDocument.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      version: newDocument.version.trim() || '1.0',
      reviewDate: newDocument.reviewDate || '',
      requiredRead: Boolean(newDocument.requiredRead),
      readBy: [],
      file: newDocument.file,
      authorId: currentUser.id,
      author: currentUser.name,
      createdAt: Date.now(),
    };
    documentSaveInFlight.current = true;
    setIsSavingDocument(true);
    try {
      if (isFirebaseAvailable && dbUser) { if (!await saveDoc('documents', id, documentData)) return; }
      setDocumentsList(previous => [documentData, ...previous.filter(item => item.id !== id)]);
      setNewDocument({ id: '', title: '', description: '', dept: 'all', accessMode: 'company', allowedUserIds: [], category: 'Geral', folder: '', tags: '', version: '1.0', reviewDate: '', requiredRead: false, file: null });
      setShowDocumentModal(false);
      triggerNotification('Documento publicado na central.');
    } finally {
      documentSaveInFlight.current = false;
      setIsSavingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId, confirmed = false) => {
    const documentItem = documentsList.find(item => item.id === documentId);
    if (!documentItem) return;
    if (!confirmed) {
      setPendingContentDeletion({type: 'document', id: documentId, title: documentItem.title || 'Documento sem título', heading: 'Excluir política ou documento?', detail: 'O arquivo, seu histórico de leitura e sua publicação serão removidos. Esta ação não pode ser desfeita por esta tela.'});
      return;
    }
    if (isFirebaseAvailable && dbUser) { if (!await removeDoc('documents', documentId)) return; }
    setDocumentsList(previous => previous.filter(item => item.id !== documentId));
    const fileRemoved = await deleteStoredFile(documentItem?.file);
    triggerNotification(fileRemoved ? 'Documento e arquivo removidos.' : 'Documento removido. A limpeza do arquivo ficará a cargo do servidor.', fileRemoved ? 'success' : 'warning');
  };

  const handleMoveDocument = async (documentItem) => {
    if (!currentUser?.isAdmin) return;
    const folder = normalizeDocumentFolder(editingDocumentFolder);
    if (folder === normalizeDocumentFolder(documentItem.folder)) {
      setEditingDocumentFolderId(null);
      return;
    }
    if (isFirebaseAvailable && dbUser) {
      if (!await updateDocField('documents', documentItem.id, { folder })) return;
    }
    setDocumentsList(previous => previous.map(item => item.id === documentItem.id ? { ...item, folder } : item));
    setEditingDocumentFolderId(null);
    triggerNotification(`Documento movido para ${folder}.`);
  };

  const handleUpdateDocumentReview = async (documentItem) => {
    if (!currentUser?.isAdmin || !/^\d{4}-\d{2}-\d{2}$/.test(editingDocumentReviewDate)) return;
    if (editingDocumentReviewDate === documentItem.reviewDate) {
      setEditingDocumentReviewId(null);
      return;
    }
    const historyEntry = {
      previousDate: documentItem.reviewDate || '',
      nextDate: editingDocumentReviewDate,
      changedAt: Date.now(),
      changedBy: currentUser.id,
      changedByName: currentUser.name,
    };
    if (isFirebaseAvailable && dbUser) {
      if (!await updateDocField('documents', documentItem.id, {
        reviewDate: editingDocumentReviewDate,
        reviewHistory: arrayUnion(historyEntry),
      })) return;
    }
    setDocumentsList(previous => previous.map(item => item.id === documentItem.id
      ? { ...item, reviewDate: editingDocumentReviewDate, reviewHistory: [...(item.reviewHistory || []), historyEntry] }
      : item));
    setEditingDocumentReviewId(null);
    triggerNotification('Prazo de revisão atualizado. A alteração ficou registrada no documento.');
  };

  const handleConfirmDocumentRead = async (documentItem) => {
    if (!currentUser?.id || (documentItem.readBy || []).includes(currentUser.id)) return;
    const readBy = [...(documentItem.readBy || []), currentUser.id];
    if (isFirebaseAvailable && dbUser) { if (!await updateDocField('documents', documentItem.id, { readBy: arrayUnion(currentUser.id) })) return; }
    setDocumentsList(previous => previous.map(item => item.id === documentItem.id ? { ...item, readBy } : item));
    triggerNotification('Leitura do documento confirmada.');
  };

  const handleSavePoll = async (event) => {
    event.preventDefault();
    let question;
    try { [question] = normalizePollQuestions([newPoll]); }
    catch (error) { triggerNotification(error.message, 'error'); return; }
    const id = `poll-${Date.now()}`;
    const createdAt = Date.now();
    const poll = { id, ...question, category: newPoll.category, votes: {}, expiresAt: newPoll.expiresAt || '', author: currentUser.name, authorId: currentUser.id, createdAt, date: new Date(createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) };
    if (isFirebaseAvailable && dbUser) { if (!await saveDoc('polls', id, poll)) return; }
    else setPollsList(previous => [poll, ...previous]);
    setNewPoll({ category: 'Pulso da equipe', question: '', type: 'single', options: ['', ''], expiresAt: '' });
    setShowPollModal(false);
    triggerNotification('Enquete publicada e adicionada ao feed da equipe.');
  };

  const handleSavePollForm = async (event) => {
    event.preventDefault();
    if (!currentUser?.isAdmin || !newPollForm.title.trim()) return;
    let questions;
    try { questions = normalizePollQuestions(newPollForm.questions); }
    catch (error) { triggerNotification(error.message, 'error'); return; }
    const createdAt = Date.now();
    const formId = `form-${createdAt}`;
    const polls = questions.map(({ question, type, options }, index) => ({
      id: `${formId}-question-${index + 1}`,
      formId,
      formTitle: newPollForm.title.trim(),
      formDescription: newPollForm.description.trim(),
      category: newPollForm.category,
      formOrder: index + 1,
      formQuestionCount: questions.length,
      question,
      type,
      options,
      votes: {},
      expiresAt: newPollForm.expiresAt || '',
      author: currentUser.name,
      authorId: currentUser.id,
      createdAt,
      date: new Date(createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    }));
    if (isFirebaseAvailable && dbUser) {
      if (!await saveRelatedRecords(polls.map(poll => ({ collection: 'polls', id: poll.id, data: poll })), 'Não foi possível publicar o formulário. Nenhuma pergunta foi salva.')) return;
    } else setPollsList(previous => [...polls, ...previous]);
    setNewPollForm({ title: '', description: '', category: 'Pesquisa de clima', questions: [createPollQuestion('scale')], expiresAt: '' });
    setShowPollModal(false);
    triggerNotification('Pesquisa publicada e adicionada ao feed da equipe.');
  };

  const handleVotePoll = async (poll, optionIndex) => {
    if (!currentUser?.id || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= (poll.options || []).length) return;
    if (poll.votes?.[currentUser.id] !== undefined) return;
    if (poll.expiresAt && poll.expiresAt < todayStr) return;
    const votes = { ...(poll.votes || {}), [currentUser.id]: optionIndex };
    if (isFirebaseAvailable && dbUser) {
      try {
        const pollsCollection = getTenantCollection('polls');
        if (!pollsCollection) throw new Error('Empresa indisponível.');
        await updateDoc(doc(pollsCollection, poll.id), new FieldPath('votes', currentUser.id), optionIndex);
      } catch (error) {
        console.error('Falha ao registrar voto', error);
        triggerNotification('Não foi possível registrar o voto. Atualize a enquete e tente novamente.', 'error');
        return;
      }
    }
    else setPollsList(previous => previous.map(item => item.id === poll.id ? { ...item, votes } : item));
    triggerNotification('Voto registrado. Obrigado por participar!');
  };

  const handleSaveVacancy = async (event) => {
    event.preventDefault();
    if (!isCareerManagerUser(currentUser) || !activeCompany?.id) return;
    const skills = [...new Set(newVacancy.skills.split(',').map(item => item.trim()).filter(Boolean))].slice(0, 20);
    let quiz = [];
    try { quiz = normalizeVacancyQuiz(newVacancy.quiz); }
    catch (error) { triggerNotification(error.message, 'error'); return; }
    if (newVacancy.description.trim().length < 30) {
      triggerNotification('Descreva a vaga com pelo menos 30 caracteres.', 'error');
      return;
    }
    const id = `vacancy-${Date.now()}`;
    const vacancy = {
      id,
      roleId: newVacancy.roleId || '',
      roleName: rolesList.find(role => role.id === newVacancy.roleId)?.name || newVacancy.title.trim(),
      title: newVacancy.title.trim(),
      description: newVacancy.description.trim(),
      location: newVacancy.location.trim(),
      mode: newVacancy.mode,
      skills,
      quiz,
      closesAt: newVacancy.closesAt || '',
      status: 'published',
      createdAt: Date.now(),
      authorId: currentUser.id,
    };
    if (!await saveDoc('vacancies', id, vacancy)) return;
    setNewVacancy({ roleId: '', title: '', description: '', location: '', mode: 'Presencial', skills: '', quiz: [], closesAt: '' });
    setShowVacancyModal(false);
    triggerNotification('Vaga publicada no Banco de Talentos.');
  };

  const handleCloseVacancy = async (vacancy) => {
    if (!isCareerManagerUser(currentUser) || !await updateDocField('vacancies', vacancy.id, { status: vacancy.status === 'published' ? 'closed' : 'published' })) return;
    triggerNotification(vacancy.status === 'published' ? 'Vaga encerrada.' : 'Vaga reaberta.');
  };

  const handleArchiveVacancy = async (vacancy) => {
    if (!isCareerManagerUser(currentUser) || vacancy.status === 'published') return;
    if (!await updateDocField('vacancies', vacancy.id, { status: vacancy.status === 'archived' ? 'closed' : 'archived', archivedAt: Date.now(), archivedBy: currentUser.name })) return;
    triggerNotification(vacancy.status === 'archived' ? 'Vaga devolvida para encerradas.' : 'Vaga arquivada. Ela continuará no histórico interno e não ficará disponível para candidatos.');
  };

  const handleGenerateCareerAssessment = async (application) => {
    if (!isCareerManagerUser(currentUser) || !application?.id || careerAiAnalyzingId) return;
    const vacancy = vacanciesList.find(item => item.id === application.vacancyId);
    if (!vacancy) {
      triggerNotification('Não foi possível localizar os dados da vaga para fazer a análise.', 'error');
      return;
    }
    setCareerAiAnalyzingId(application.id);
    try {
      const quizSummary = (application.quizQuestions || []).map((question, index) => `${question.question}: ${question.options?.[application.quizAnswers?.[index]] || 'Sem resposta'}`).join('\n');
      const prompt = `Compare o perfil abaixo com a vaga.\n\nVAGA\nTítulo: ${vacancy.title}\nDescrição: ${vacancy.description}\nCompetências desejadas: ${(vacancy.skills || []).join(', ') || 'Não informadas'}\n\nPERFIL DO CANDIDATO\nCidade: ${application.city || 'Não informada'}\nCompetências declaradas: ${(application.declaredSkills || application.skills || []).join?.(', ') || 'Não informadas'}\nResumo profissional: ${String(application.resumeText || '').slice(0, 7000)}\nRespostas do questionário:\n${quizSummary || 'Sem questionário'}\n\nProduza um parecer curto e útil para triagem humana.`;
      const assessment = await callGemini(prompt, 'Você apoia recrutadores brasileiros com análise responsável de currículos. Escreva em português claro, sem Markdown, asteriscos ou notas numéricas inventadas. Organize em cinco parágrafos curtos com estes títulos em texto simples: Resumo da aderência, Pontos fortes, Lacunas ou pontos a validar, Perguntas para entrevista, Recomendação de próxima etapa. Use apenas as informações fornecidas, sinalize quando não houver evidência e nunca recomende exclusão com base em idade, gênero, raça, deficiência, religião, estado civil ou qualquer característica protegida. A decisão final é sempre humana.');
      if (!assessment || /problema temporário/i.test(assessment)) throw new Error('Análise indisponível');
      const payload = { aiAssessment: assessment.trim(), aiAssessmentAt: Date.now(), aiAssessmentBy: currentUser.name, aiAssessmentVacancyUpdatedAt: Number(vacancy.updatedAt || vacancy.createdAt || 0) };
      if (!await updateDocField('applications', application.id, payload)) return;
      triggerNotification('Parecer de aderência gerado e salvo na candidatura.');
    } catch (error) {
      console.error('Falha ao gerar parecer da candidatura', error);
      triggerNotification('Não foi possível gerar o parecer agora. Tente novamente em instantes.', 'error');
    } finally {
      setCareerAiAnalyzingId('');
    }
  };

  const careerEmailUrl = (application, subject, message) => `mailto:${encodeURIComponent(application.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  const saveCareerDecision = async (event) => {
    event.preventDefault();
    const draft = careerDecisionDraft;
    if (!draft?.application || !draft.message.trim()) return;
    const application = draft.application;
    const status = draft.outcome === 'approved' ? 'preselected' : 'rejected';
    const title = draft.outcome === 'approved' ? 'Você avançou na seleção' : 'Atualização sobre sua candidatura';
    const payload = {
      status,
      reviewNotes: draft.internalNote.trim(),
      recruitmentUpdate: { type: draft.outcome, title, message: draft.message.trim(), createdAt: Date.now(), createdBy: currentUser.name },
      decisionAt: Date.now(), decisionBy: currentUser.name,
      discardReason: draft.outcome === 'rejected' ? draft.internalNote.trim() : '',
    };
    if (!await updateDocField('applications', application.id, payload)) return;
    setCareerDecisionDraft(null);
    triggerNotification(draft.outcome === 'approved' ? 'Candidato pré-selecionado e avisado no portal.' : 'Candidatura descartada e retorno registrado no portal.');
    if (draft.openEmail) window.location.href = careerEmailUrl(application, `${title} — ${application.vacancyTitle}`, `Olá, ${application.name}.\n\n${draft.message.trim()}\n\nAtenciosamente,\n${activeCompany?.name || 'Equipe de recrutamento'}`);
  };

  const saveCareerInterview = async (event) => {
    event.preventDefault();
    const draft = careerInterviewDraft;
    if (!draft?.application || !draft.date || !draft.time || !draft.contact.trim()) return;
    const application = draft.application;
    const interview = { date: draft.date, time: draft.time, format: draft.format, location: draft.location.trim(), contact: draft.contact.trim(), notes: draft.notes.trim() };
    const message = draft.message.trim() || `Você foi pré-selecionado(a) para entrevista em ${formatDate(draft.date)} às ${draft.time}. ${draft.format}${draft.location.trim() ? `: ${draft.location.trim()}` : ''}. Para confirmar ou tirar dúvidas, entre em contato por ${draft.contact.trim()}.`;
    const payload = { status: 'interview', reviewNotes: draft.internalNote.trim(), interview, recruitmentUpdate: { type: 'interview', title: 'Convite para entrevista', message, createdAt: Date.now(), createdBy: currentUser.name }, interviewScheduledAt: Date.now(), interviewScheduledBy: currentUser.name };
    if (!await updateDocField('applications', application.id, payload)) return;
    setCareerInterviewDraft(null);
    triggerNotification('Entrevista agendada e convite disponível no portal do candidato.');
    if (draft.openEmail) window.location.href = careerEmailUrl(application, `Convite para entrevista — ${application.vacancyTitle}`, `Olá, ${application.name}.\n\n${message}\n\nAtenciosamente,\n${activeCompany?.name || 'Equipe de recrutamento'}`);
  };

  const handleDownloadCareerResume = async (application) => {
    try {
      const result = await httpsCallable(functionsClient, 'downloadCareerResume')({ companyId: activeCompany.id, applicationId: application.id });
      const binary = atob(result.data.base64);
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: result.data.contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      console.error('Falha ao baixar currículo', error);
      triggerNotification('Não foi possível abrir o currículo.', 'error');
    }
  };

  const handleExtendCareerRetention = async (application) => {
    try {
      const result = await httpsCallable(functionsClient, 'extendCareerApplicationRetention')({ companyId: activeCompany.id, applicationId: application.id });
      triggerNotification(`Prazo prorrogado até ${formatCareerDate(result.data.retentionUntil)}.`);
    } catch (error) {
      console.error('Falha ao prorrogar currículo', error);
      triggerNotification(error?.message?.includes('já foi prorrogado') ? 'O prazo desta candidatura já foi prorrogado uma vez.' : 'Não foi possível prorrogar o prazo.', 'error');
    }
  };

  const handlePurgeExpiredCareers = async () => {
    try {
      const result = await httpsCallable(functionsClient, 'purgeExpiredCareerApplications')({ companyId: activeCompany.id });
      setConfirmCareerCleanup(false);
      triggerNotification(result.data.deleted ? `${result.data.deleted} candidatura(s) vencida(s) e respectivos currículos foram removidos.` : 'Não há currículos vencidos para remover.');
      if (result.data.hasMore) triggerNotification('Ainda existem registros vencidos. Execute a limpeza novamente.', 'error');
    } catch (error) {
      console.error('Falha ao limpar currículos vencidos', error);
      triggerNotification('Não foi possível remover os currículos vencidos.', 'error');
    }
  };

  const handleLikePost = async (id) => {
    if (!currentUser) return;
    const post = sectorPosts.find(p => p.id === id);
    if (!post) return;

    const hasLiked = post.likedBy?.includes(currentUser.id);
    const updatedLikes = hasLiked ? post.likes - 1 : post.likes + 1;
    const updatedLikedBy = hasLiked
      ? post.likedBy.filter(uid => uid !== currentUser.id)
      : [...(post.likedBy || []), currentUser.id];

    if (isFirebaseAvailable && dbUser) {
      if (!await updateDocField('posts', id, { likes: updatedLikes, likedBy: updatedLikedBy })) return;
    } else {
      setSectorPosts(prev => prev.map(p => p.id === id ? { ...p, likes: updatedLikes, likedBy: updatedLikedBy } : p));
    }
  };

  const handleAddComment = async (id, type) => {
    if (!currentUser) return;
    const text = commentText[id]?.trim();
    if (!text) return;

    const commentObj = { author: currentUser.name, text: text, date: 'Agora' };

    if (type === 'announcement') {
      const ann = announcements.find(a => a.id === id);
      if (ann) {
        const commentsList = [...(ann.comments || []), commentObj];
        if (isFirebaseAvailable && dbUser) {
          if (!await updateDocField('announcements', id, { comments: commentsList })) return;
        } else {
          setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, comments: commentsList } : a));
        }
      }
    } else {
      const post = sectorPosts.find(p => p.id === id);
      if (post) {
        const commentsList = [...(post.comments || []), commentObj];
        if (isFirebaseAvailable && dbUser) {
          if (!await updateDocField('posts', id, { comments: commentsList })) return;
        } else {
          setSectorPosts(prev => prev.map(p => p.id === id ? { ...p, comments: commentsList } : p));
        }
      }
    }
    setCommentText(prev => ({ ...prev, [id]: '' }));
    triggerNotification('Comentário publicado!');
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.isAdmin) {
      triggerNotification('Acesso negado. Apenas administradores do RH podem postar avisos.', 'error');
      return;
    }
    if (!newAnn.title || !newAnn.content) return;

    const primaryDeptId = getUserDepts(currentUser)[0] || 'rh';
    const currentDeptName = departmentsList.find(d => d.id === primaryDeptId)?.name || 'Geral';
    const annId = `ann-${Date.now()}`;
    const created = {
      id: annId,
      title: newAnn.title,
      content: newAnn.content,
      category: newAnn.category,
      image: newAnn.image || '',
      author: `${currentUser.name} (${currentDeptName})`,
date: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      pinned: false,
      likes: 0,
      likedBy: [],
      comments: []
    };

    if (isFirebaseAvailable && dbUser) {
      if (!await saveDoc('announcements', annId, created)) return;
      setAnnouncements(previous => [created, ...previous.filter(item => item.id !== annId)]);
    } else {
      setAnnouncements([created, ...announcements]);
    }

    setNewAnn({ title: '', content: '', category: 'Aviso Geral', image: '' });
    setShowAnnModal(false);
    triggerNotification('Comunicado oficial publicado na Comunica!');
  };

  const submitSectorPost = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newPost.title || !newPost.content) return;
    if (!newPost.depts || newPost.depts.length === 0) {
      triggerNotification('Selecione pelo menos um setor de destino.', 'error');
      return;
    }

    const tagsArray = newPost.tags ? newPost.tags.split(',').map(t => t.trim()) : [];
    const createdPosts = [];

    for (const deptId of newPost.depts) {
      const postId = `post-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const created = {
        id: postId,
        dept: deptId,
        title: newPost.title,
        content: newPost.content,
        image: newPost.image || '',
        author: currentUser.name,
        authorId: currentUser.id,
date: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
        likedBy: [],
        comments: [],
        tags: tagsArray
      };
      createdPosts.push(created);

    }

    if (isFirebaseAvailable && dbUser) {
      if (!await saveRelatedRecords(createdPosts.map(post => ({ collection: 'posts', id: post.id, data: post })))) return;
      const createdIds = new Set(createdPosts.map(post => post.id));
      setSectorPosts(previous => [...createdPosts, ...previous.filter(post => !createdIds.has(post.id))]);
    } else {
      setSectorPosts([...createdPosts, ...sectorPosts]);
    }

    setNewPost({ title: '', content: '', depts: [], tags: '', image: '' });
    setShowPostModal(false);
    triggerNotification(createdPosts.length > 1 ? 'Posts publicados em múltiplos setores!' : 'Post setorial publicado com sucesso!');
  };
const handleDeletePost = async (postId, confirmed = false) => {
  const postObj = sectorPosts.find(p => p.id === postId);
  if (!postObj) return;

  if (postObj.authorId !== currentUser.id && !currentUser.isAdmin) {
    triggerNotification('Você só possui permissão para deletar suas próprias postagens.', 'error');
    return;
  }

  if (!confirmed) {
    setPendingContentDeletion({type: 'post', id: postId, title: postObj.title || 'Publicação sem título', heading: 'Excluir publicação do canal?', detail: 'A postagem deixará de aparecer para todos os integrantes do setor. Esta ação não pode ser desfeita por esta tela.'});
    return;
  }

  if (isFirebaseAvailable && dbUser) {
    try {
      // Adicionamos o 'await' e um bloco 'try/catch'
      if (!await removeDoc('posts', postId)) return;

      // Só removemos da tela SE o Firebase confirmar a exclusão
      setSectorPosts(prev => prev.filter(p => p.id !== postId));
      triggerNotification('Postagem removida com sucesso!');

    } catch (error) {
      console.error("Erro ao deletar no Firebase:", error);
      triggerNotification('Erro ao conectar com o banco. A postagem não foi removida.', 'error');
    }
  } else {
    setSectorPosts(prev => prev.filter(p => p.id !== postId));
    triggerNotification('Postagem removida (Modo Offline)!');
  }
};
  const handleEditProductivity = (log) => {
    if (!canManageAllProductivity) return;
    setEditingProdId(log.id);
    setNewProdLog({
      group: log.group,
      date: log.date || todayStr,
      quantity: log.quantity,
      defects: log.defects || '',
      productDescription: log.productDescription || '',
      notes: log.notes || '',
      image: log.image || ''
    });
    setShowProdModal(true);
  };

const submitProductivity = async (e) => {
    e.preventDefault();
    if (!currentUser || !canAccessProductivity) return;
    if (!canManageAllProductivity && newProdLog.group !== currentUser.prodGroup) {
      triggerNotification('Você só pode registrar produções do seu próprio grupo.', 'error');
      return;
    }
    if (!newProdLog.quantity || isNaN(newProdLog.quantity)) {
      triggerNotification('Insira uma quantidade válida.', 'error');
      return;
    }

    if (editingProdId) {
      const existingLog = productivityLogs.find(p => p.id === editingProdId);
      const formattedEditDate = newProdLog.date.split('-').reverse().join('/');

      const updatedLog = {
        ...existingLog,
        group: newProdLog.group,
        date: newProdLog.date,
        displayDate: `${formattedEditDate} (Editado)`,
        quantity: parseInt(newProdLog.quantity, 10),
        defects: parseInt(newProdLog.defects, 10) || 0,
        productDescription: newProdLog.productDescription || '',
        notes: newProdLog.notes,
        image: newProdLog.image || ''
      };

      if (isFirebaseAvailable && dbUser) {
        if (!await saveDoc('productivity', editingProdId, updatedLog)) return;
      }
      setProductivityLogs(prev => prev.map(p => p.id === editingProdId ? updatedLog : p));
      triggerNotification('Produção atualizada com sucesso!');

    } else {
      const prodId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const formattedDate = newProdLog.date.split('-').reverse().join('/');

      const created = {
        id: prodId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        group: newProdLog.group,
        quantity: parseInt(newProdLog.quantity, 10),
        defects: parseInt(newProdLog.defects, 10) || 0,
        productDescription: newProdLog.productDescription || '',
        notes: newProdLog.notes,
        image: newProdLog.image || '',
        date: newProdLog.date, // Puxando a data do formulário
        displayDate: `${formattedDate} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      };

      if (isFirebaseAvailable && dbUser) {
        if (!await saveDoc('productivity', prodId, created)) return;
      }
      setProductivityLogs(prev => [created, ...prev.filter(log => log.id !== created.id)]);
      triggerNotification('Produção registrada com sucesso!');
    }

    // Limpa o formulário e fecha a tela
    setNewProdLog({ group: 'Máquina 1', date: todayStr, quantity: '', defects: '', productDescription: '', notes: '', image: '' });
    setEditingProdId(null);
    setShowProdModal(false);
  };

  const handleDeleteProductivity = async (prodId) => {
    if (!canManageAllProductivity) return;
    if (isFirebaseAvailable && dbUser) {
      if (!await removeDoc('productivity', prodId)) return;
    }
    setProductivityLogs(prev => prev.filter(p => p.id !== prodId));
    triggerNotification('Registro de produção removido.');
  };

const submitPresence = async (e) => {
  e.preventDefault();

  // Envolvemos TUDO no try-catch para capturar qualquer travamento
  try {
    if (!currentUser) return;

    // Blindagem de strings: previne o erro "Cannot read properties of undefined (reading 'toLowerCase')"
    const userToSubmit = newPresence?.name || '';
    const targetUser = usersList.find(u => String(u?.name || '').toLowerCase() === String(userToSubmit).toLowerCase());

    if (!targetUser) {
      triggerNotification('Usuário não encontrado na lista.', 'error');
      return;
    }

    const isPublishingAnotherPersonsVacation = targetUser.id !== currentUser.id && String(newPresence?.status || '').includes('Férias');
    const mayPublishAnotherPersonsAbsence = Boolean(currentUser.isAdmin || currentUser.isDeveloper || isManager || effectiveAccessProfile.canPublishAbsenceForOthers === true);
    if (isPublishingAnotherPersonsVacation && !mayPublishAnotherPersonsAbsence) {
      triggerNotification('Você não tem permissão para publicar férias de outra pessoa.', 'error');
      return;
    }

    const existing = presenceList.find(p => String(p?.name || '').toLowerCase() === String(userToSubmit).toLowerCase());

    let statusFinalDeHoje = newPresence?.status || 'Presencial';
    let isFeriasFuturas = false;

    // 1. AVALIA A TRAVA DE FÉRIAS (Agora aceita "Licença / Férias")
    if (String(statusFinalDeHoje).includes('Férias') && newPresence.startDate && newPresence.endDate) {
      if (newPresence.endDate < newPresence.startDate) {
        triggerNotification('A data de retorno não pode ser anterior à data de início.', 'error');
        return;
      }

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Tratamento seguro de data caso venha com barras ou traços
      let dtInicioFormatada = newPresence.startDate;
      if (dtInicioFormatada.includes('/')) {
        dtInicioFormatada = dtInicioFormatada.split('/').reverse().join('-');
      }
      const dataInicio = new Date(dtInicioFormatada + 'T00:00:00');

      if (hoje < dataInicio) {
        isFeriasFuturas = true;
        // Se já havia status presencial/home office, mantém. Se não, volta pra presencial.
        statusFinalDeHoje = (existing && !String(existing.status).includes('Férias')) ? existing.status : 'Presencial';
      }
    }

    const data = {
      status: statusFinalDeHoje,
      notes: newPresence?.notes || '',
      dept: newPresence?.dept || '',
      name: userToSubmit,
      userId: targetUser.id,
    };

    const presenceId = existing?.id || `pres-${Date.now()}`;
    const updatedPresence = { ...existing, id: presenceId, ...data };
    const shouldSavePresence = !(isPublishingAnotherPersonsVacation && isFeriasFuturas);
    const records = shouldSavePresence ? [{
      collection: 'presence',
      id: presenceId,
      data: updatedPresence,
      ...(existing ? { operation: 'update' } : {}),
    }] : [];
    let createdAbsence = null;
    let autoPost = null;

    // 3. SE FOR FÉRIAS, CRIA A AUSÊNCIA E O POST AUTOMÁTICO
    if (String(newPresence?.status || '').includes('Férias') && newPresence.startDate && newPresence.endDate) {
      // A mesma programação de férias deve ter um único registro e um único
      // comunicado. Reaproveitar o registro impede posts repetidos no canal.
      const existingVacation = absences.find(absence =>
        (String(absence.userId) === String(targetUser.id) || normalizedText(absence.userName) === normalizedText(targetUser.name)) &&
        isVacationAbsence(absence) && absence.startDate === newPresence.startDate && absence.endDate === newPresence.endDate
      );
      const absId = existingVacation?.id || `abs-ferias-${targetUser.id}-${newPresence.startDate}-${newPresence.endDate}`;
      createdAbsence = {
        id: absId,
        userId: targetUser.id,
        userName: targetUser.name,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        startDate: newPresence.startDate,
        endDate: newPresence.endDate,
        startTime: '08:00',
        endTime: '18:00',
        reason: 'Férias'
      };

      const postAbsId = `post-abs-${absId}`;

      // Proteção caso a função getUserDepts falhe ou não exista
      let primaryDeptId = 'rh';
      try { primaryDeptId = getUserDepts(targetUser)[0] || 'rh'; } catch(err) {}

      // Formata as datas para o post sem quebrar o código
      let fStart = newPresence.startDate;
      if (fStart.includes('-')) { const p = fStart.split('-'); fStart = `${p[2]}/${p[1]}/${p[0]}`; }

      let fEnd = newPresence.endDate;
      if (fEnd.includes('-')) { const p = fEnd.split('-'); fEnd = `${p[2]}/${p[1]}/${p[0]}`; }

      autoPost = {
        id: postAbsId,
        dept: primaryDeptId,
        title: `🌴 Férias Programadas: ${targetUser.name}`,
        content: `Informamos a todos que ${targetUser.name} estará de férias e indisponível do dia ${fStart} até o dia ${fEnd}.\n\nDesejamos um excelente e merecido descanso!`,
        image: '',
        author: 'RH Oficial',
        authorId: 'system',
        date: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        likes: 0,
        likedBy: [],
        comments: [],
        tags: ['Férias', 'Aviso', 'Equipe']
      };

      const existingPost = sectorPosts.some(post => post.id === postAbsId);
      records.push(
        { collection: 'absences', id: absId, data: createdAbsence, ...(existingVacation ? { operation: 'update' } : {}) },
        { collection: 'posts', id: postAbsId, data: autoPost, ...(existingPost ? { operation: 'update' } : {}) }
      );

      // Limpa duplicações antigas que tenham exatamente o mesmo período, sem
      // apagar férias de outros dias do mesmo colaborador.
      absences.filter(absence => absence.id !== absId &&
        (String(absence.userId) === String(targetUser.id) || normalizedText(absence.userName) === normalizedText(targetUser.name)) &&
        isVacationAbsence(absence) && absence.startDate === newPresence.startDate && absence.endDate === newPresence.endDate
      ).forEach(duplicate => {
        records.push({ collection: 'absences', id: duplicate.id, data: {}, operation: 'delete' });
        const duplicatePostId = `post-abs-${duplicate.id}`;
        if (sectorPosts.some(post => post.id === duplicatePostId)) records.push({ collection: 'posts', id: duplicatePostId, data: {}, operation: 'delete' });
      });
    }

    if (!await saveRelatedRecords(records, 'Não foi possível salvar o status ou as férias na nuvem. Nenhuma alteração foi confirmada; o formulário foi preservado.')) return;
    if (shouldSavePresence) setPresenceList(prev => existing
      ? prev.map(presence => presence.id === presenceId ? updatedPresence : presence)
      : [...prev, updatedPresence]);
    if (createdAbsence && autoPost) {
      setAbsences(prev => [createdAbsence, ...prev.filter(absence => absence.id !== createdAbsence.id && !(
        (String(absence.userId) === String(createdAbsence.userId) || normalizedText(absence.userName) === normalizedText(createdAbsence.userName)) &&
        isVacationAbsence(absence) && absence.startDate === createdAbsence.startDate && absence.endDate === createdAbsence.endDate
      ))]);
      const vacationPostIds = new Set([
        `post-abs-${createdAbsence.id}`,
        ...absences.filter(absence =>
          (String(absence.userId) === String(createdAbsence.userId) || normalizedText(absence.userName) === normalizedText(createdAbsence.userName)) &&
          isVacationAbsence(absence) && absence.startDate === createdAbsence.startDate && absence.endDate === createdAbsence.endDate
        ).map(absence => `post-abs-${absence.id}`),
      ]);
      setSectorPosts(prev => [autoPost, ...prev.filter(post => !vacationPostIds.has(post.id))]);
      triggerNotification(isFeriasFuturas
        ? 'Férias agendadas! O status mudará quando a data chegar.'
        : 'Férias ativadas e adicionadas ao calendário!');
    } else {
      triggerNotification('Status diário de trabalho atualizado.');
    }

    // 4. FECHA O MODAL COM SUCESSO
    setShowPresenceModal(false);

  } catch (error) {
    console.error("Erro CRÍTICO no submitPresence:", error);
    triggerNotification('Não foi possível confirmar a alteração. Tente novamente.', 'error');
  }
};
  const submitAbsence = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newAbsence.reason) return;
    if (isVacationAbsence(newAbsence)) {
      triggerNotification('Para registrar férias, use a Escala de Trabalho. Assim o calendário e o canal recebem apenas um comunicado.', 'error');
      return;
    }

    if (newAbsence.endDate < newAbsence.startDate) {
      triggerNotification('A data de término não pode ser anterior à data de início.', 'error');
      return;
    }

    const absenceTarget = employeesList.find(user => String(user.id) === String(newAbsence.targetUserId || currentUser.id)) || currentUser;
    const publishingForAnother = String(absenceTarget.id) !== String(currentUser.id);
    if (publishingForAnother && !currentUser.isAdmin && !currentUser.isDeveloper && !isManager && effectiveAccessProfile.canPublishAbsenceForOthers !== true) {
      triggerNotification('Você não tem permissão para agendar ausência de outra pessoa.', 'error');
      return;
    }

    const absId = `abs-${Date.now()}`;
    const created = {
      id: absId,
      userId: absenceTarget.id,
      userName: absenceTarget.name,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      startDate: newAbsence.startDate,
      endDate: newAbsence.endDate,
      startTime: newAbsence.startTime,
      endTime: newAbsence.endTime,
      reason: newAbsence.reason
    };

    const [sYear, sMonth, sDay] = newAbsence.startDate.split('-');
    const formattedStart = `${sDay}/${sMonth}/${sYear}`;

    const [eYear, eMonth, eDay] = newAbsence.endDate.split('-');
    const formattedEnd = `${eDay}/${eMonth}/${eYear}`;

    const dateText = newAbsence.startDate === newAbsence.endDate
      ? `no dia ${formattedStart}`
      : `do dia ${formattedStart} até o dia ${formattedEnd}`;

    const postAbsId = `post-abs-${absId}`;
    const primaryDeptId = getUserDepts(absenceTarget)[0] || 'rh';

    const autoPost = {
      id: postAbsId,
      dept: primaryDeptId,
      title: `🕒 Ausência Programada: ${absenceTarget.name}`,
      content: publishingForAnother
        ? `Informamos que ${absenceTarget.name} estará ausente ${dateText} no período das ${newAbsence.startTime} às ${newAbsence.endTime}.\n\nMotivo: "${newAbsence.reason}". Publicado por ${currentUser.name}.`
        : `Prezada equipe, informo que estarei ausente ${dateText} no período das ${newAbsence.startTime} às ${newAbsence.endTime}.\n\nMotivo da indisponibilidade: "${newAbsence.reason}". Por favor, alinhem as urgências caso necessário.`,
      image: '',
      author: 'Notificador de Escalas',
      authorId: 'system',
      date: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      comments: [],
      tags: ['Ausência', 'Escala', 'Organização']
    };

    if (!await saveRelatedRecords([
      { collection: 'absences', id: absId, data: created },
      { collection: 'posts', id: postAbsId, data: autoPost },
    ])) return;

    setNewAbsence({ targetUserId: currentUser.id, startDate: todayStr, endDate: todayStr, startTime: '09:00', endTime: '12:00', reason: '' });
    setShowAbsenceModal(false);
    triggerNotification('Ausência registrada e publicada no canal do seu setor!');
  };

  const bulkScheduleOccurrences = (schedule = bulkSchedule) => {
    const quantity = Math.min(52, Math.max(1, Number(schedule.repeatCount) || 1));
    const interval = schedule.repeatInterval || 'semanal';
    return Array.from({ length: quantity }, (_, index) => {
      const shift = interval === 'mensal'
        ? { months: index }
        : { days: index * (interval === 'quinzenal' ? 14 : 7) };
      return {
        startDate: civilDateShift(schedule.startDate, shift),
        endDate: civilDateShift(schedule.endDate, shift),
      };
    });
  };

  const bulkScheduleEligibleEmployees = (schedule = bulkSchedule) => {
    const search = normalizedText(schedule.employeeSearch);
    return scheduleScope.employees.filter(user => {
      const belongsToDepartment = schedule.dept === 'Todos' || getUserDepts(user).includes(schedule.dept);
      const belongsToRole = !schedule.role || schedule.role === 'Todos' || user.role === schedule.role;
      const isSelected = (schedule.userIds || []).some(id => String(id) === String(user.id));
      const matchesSelection = !schedule.selectionFilter || schedule.selectionFilter === 'Todos'
        || (schedule.selectionFilter === 'Selecionados' && isSelected)
        || (schedule.selectionFilter === 'Não selecionados' && !isSelected);
      const searchable = normalizedText(`${user.name} ${user.role || ''} ${getUserDepts(user).join(' ')}`);
      return belongsToDepartment && belongsToRole && matchesSelection && (!search || searchable.includes(search));
    }).sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  };

  const openBulkSchedule = (period = 'day') => {
    setAutomaticScheduleProblem(null);
    const eligible = bulkScheduleEligibleEmployees({ ...bulkSchedule, employeeSearch: '', selectionFilter: 'Todos' });
    setBulkSchedule(previous => ({
      ...previous,
      startDate: period === 'month' ? selectedCalendarDay.slice(0, 7) + '-01' : selectedCalendarDay,
      endDate: period === 'month' ? `${selectedCalendarDay.slice(0, 7)}-${String(new Date(Number(selectedCalendarDay.slice(0, 4)), Number(selectedCalendarDay.slice(5, 7)), 0).getDate()).padStart(2, '0')}` : selectedCalendarDay,
      employeeSearch: '',
      selectionFilter: 'Todos',
      userIds: eligible.map(user => user.id),
    }));
    setAutomaticScheduleProposal([]);
    setAutomaticSchedulePreviewDate(selectedCalendarDay);
    setBulkScheduleMode('smart');
    setAutomaticScheduleRuleTab('planning');
    setAutomaticScheduleOptimization(null);
    setShowBulkScheduleModal(true);
  };

  const scheduleTimeToMinutes = value => {
    const [hours, minutes] = String(value || '00:00').split(':').map(Number);
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
  };
  const scheduleMinutesToTime = value => {
    const minutes = ((Math.round(Number(value) || 0) % 1440) + 1440) % 1440;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  };
  const scheduleDurationToText = value => {
    const minutes = Math.max(0, Math.round((Number(value) || 0) * 60));
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  };
  const scheduleTextToHours = value => Math.max(0, scheduleTimeToMinutes(value) / 60);
  const scheduleIntervalMinutes = (start, end, fallback = 0) => {
    if (!start || !end) return Math.max(0, Number(fallback) || 0);
    const startMinutes = scheduleTimeToMinutes(start);
    let endMinutes = scheduleTimeToMinutes(end);
    if (endMinutes < startMinutes) endMinutes += 1440;
    return Math.max(0, endMinutes - startMinutes);
  };
  const scheduleTimeWithinShift = (time, shiftStart, shiftEnd) => {
    if (!time || !shiftStart || !shiftEnd) return false;
    const start = scheduleTimeToMinutes(shiftStart);
    let end = scheduleTimeToMinutes(shiftEnd);
    let point = scheduleTimeToMinutes(time);
    if (end <= start) end += 1440;
    if (point < start) point += 1440;
    return point >= start && point <= end;
  };
  const automaticScheduleRowHours = row => {
    if (!['Presencial', 'Home Office'].includes(row?.status)) return { regular: 0, extra: 0, total: 0, actualEnd: '' };
    const start = scheduleTimeToMinutes(row.shiftStart);
    let end = scheduleTimeToMinutes(row.shiftEnd);
    if (end < start) end += 1440;
    const breakMinutes = scheduleIntervalMinutes(row.breakStart, row.breakEnd, row.breakMinutes);
    const regular = Math.max(0, end - start - breakMinutes) / 60;
    const extra = Math.max(0, Number(row.extraHours) || 0);
    return { regular, extra, total: regular + extra, actualEnd: scheduleMinutesToTime(end + extra * 60), breakMinutes };
  };
  const updateAutomaticScheduleRow = (key, changes) => {
    setAutomaticScheduleProposal(previous => previous.map(row => row.key === key && !isProtectedProposalRow(row) ? { ...row, ...changes, ruleReason: 'Ajuste manual somente neste dia', ruleConflicts: [], manuallyAdjusted: true, locked: true } : row));
  };
  const changeAutomaticScheduleStatus = (item, status) => updateAutomaticScheduleRow(item.key, scheduleStatusChange(item, status, automaticScheduleRules, workSchedules, bulkSchedule.startDate));
  const repeatAutomaticScheduleOvertime = source => {
    const extraHours = Math.max(0, Number(source.extraHours) || 0);
    setAutomaticScheduleProposal(previous => previous.map(row => (
      row.userId === source.userId && row.date >= source.date && !isProtectedProposalRow(row) && ['Presencial', 'Home Office'].includes(row.status)
        ? { ...row, extraHours, locked: true, manuallyAdjusted: true }
        : row
    )));
    triggerNotification(`Horas extras repetidas para os próximos dias de trabalho de ${source.userName}.`);
  };

  const saveAutomaticScheduleRules = async () => {
    if (!currentUser?.isAdmin && !currentUser?.isDeveloper && effectiveAccessProfile.canManageScheduleRules === false) {
      return triggerNotification('Seu perfil pode usar a escala, mas não pode alterar conjuntos e regras inteligentes.', 'error');
    }
    const weeklyHours = scheduleTextToHours(automaticScheduleWeeklyHoursText);
    if (!/^\d{1,3}:[0-5]\d$/.test(automaticScheduleWeeklyHoursText) || weeklyHours < 1 || weeklyHours > 84) {
      return triggerNotification('Informe a carga semanal no formato hh:mm, entre 01:00 e 84:00.', 'error');
    }
    const normalized = sanitizeAutomaticScheduleRules({ ...automaticScheduleRules, hoursPerWeek: weeklyHours });
    const shiftError = validateScheduleShifts(normalized.shifts, normalized.ruleGroups);
    if (shiftError) return triggerNotification(shiftError, 'error');
    const ruleErrors = validateRuleGroups(normalized.ruleGroups);
    if (ruleErrors.length) return triggerNotification(ruleErrors[0], 'error');
    const configurationAudit = auditScheduleConfiguration(normalized);
    if (configurationAudit.errors.length) return triggerNotification(configurationAudit.errors[0].message, 'error');
    const intervalMinutes = scheduleIntervalMinutes(normalized.breakStart, normalized.breakEnd);
    if (!normalized.breakStart || !normalized.breakEnd || intervalMinutes <= 0 || intervalMinutes > 360) {
      return triggerNotification('Informe um intervalo válido, com início e fim, de até 06:00.', 'error');
    }
    if (normalized.workDaysPerWeek >= normalized.restEveryDays) {
      return triggerNotification('As regras são incompatíveis: o descanso deve ocorrer depois dos dias previstos de trabalho.', 'error');
    }
    if (normalized.hoursPerWeek > normalized.maxWeeklyHours) return triggerNotification('A carga semanal não pode superar o limite semanal configurado.', 'error');
    const operationMinutes = scheduleIntervalMinutes(normalized.shiftStart, normalized.shiftEnd);
    if (!normalized.shiftStart || !normalized.shiftEnd || operationMinutes <= intervalMinutes || !scheduleTimeWithinShift(normalized.breakStart, normalized.shiftStart, normalized.shiftEnd) || !scheduleTimeWithinShift(normalized.breakEnd, normalized.shiftStart, normalized.shiftEnd)) {
      return triggerNotification('A saída padrão deve ser posterior à entrada e comportar o intervalo informado.', 'error');
    }
    if (normalized.allowedWeekdays.length < normalized.workDaysPerWeek) {
      return triggerNotification('Libere dias da semana suficientes para a quantidade de dias trabalhados.', 'error');
    }
    const regularDailyHours = (operationMinutes - intervalMinutes) / 60;
    if (regularDailyHours > normalized.maxDailyHours) return triggerNotification('A jornada padrão supera o limite diário configurado.', 'error');
    const nextVersion = Number(automaticScheduleRules.version || 1) + 1;
    const savedAt = Date.now();
    const persisted = { ...normalized, version: nextVersion, versionHistory: [...(normalized.versionHistory || []), { version: nextVersion, savedAt, savedBy: currentUser.name, summary: `${normalized.workDaysPerWeek} dias · ${scheduleDurationToText(normalized.hoursPerWeek)}h semanais · descanso mínimo ${normalized.minRestHours}h` }].slice(-12) };
    setIsSavingScheduleRules(true);
    const saved = await saveDoc('settings', 'schedule-rules', {
      ...persisted,
      updatedAt: savedAt,
      updatedBy: currentUser.name,
    });
    setIsSavingScheduleRules(false);
    if (!saved) return;
    setAutomaticScheduleRules(persisted);
    setAutomaticScheduleWeeklyHoursText(scheduleDurationToText(persisted.hoursPerWeek));
    setAutomaticScheduleProposal([]);
    triggerNotification(`Versão ${nextVersion} das regras salva para os próximos planejamentos.`);
  };

  const saveScheduleCoverageRequirements = async requirements => {
    const authorized = currentUser?.isAdmin || currentUser?.isDeveloper || (isManager && effectiveAccessProfile.canEdit !== false && effectiveAccessProfile.canManageCalendar !== false && effectiveAccessProfile.canManageScheduleRules !== false);
    if (!authorized || !scheduleCoverageReady) { triggerNotification('Seu perfil não pode configurar a necessidade de pessoas ou os dados ainda não foram carregados.', 'error'); return false; }
    const retained = scheduleScope.allDepartments ? [] : (automaticScheduleRules.coverageRequirements || []).filter(rule => !scheduleScope.departmentIds.includes(String(rule.department)));
    if (!scheduleScope.allDepartments && requirements.some(rule => !scheduleScope.departmentIds.includes(String(rule.department)))) return false;
    const normalized = normalizeCoverageRequirements([...retained, ...requirements]);
    const error = validateCoverageRequirements(normalized, departmentsList);
    if (error) { triggerNotification(error, 'error'); return false; }
    const version = Number(automaticScheduleRules.version || 1) + 1, savedAt = Date.now();
    const versionHistory = [...(automaticScheduleRules.versionHistory || []), { version, savedAt, savedBy: currentUser.name, summary: `${normalized.length} faixa(s) de cobertura configurada(s)` }].slice(-12);
    const saved = await saveDoc('settings', 'schedule-rules', { coverageRequirements: normalized, version, versionHistory, updatedAt: serverTimestamp(), updatedBy: currentUser.name });
    if (saved) { setAutomaticScheduleRules(previous => ({ ...previous, coverageRequirements: normalized, version, versionHistory })); setAutomaticScheduleProposal([]); triggerNotification(`Necessidade de pessoas salva na versão ${version}. A cobertura foi atualizada.`); }
    return saved;
  };

  const schedulePlanningContext = () => ({ history: scheduleScopedSchedules, absences: scheduleScopedAbsences, employees: scheduleScope.employees, getDepartments: getUserDepts });
  const schedulePlanningDataReady = () => scheduleCoverageReady && scheduleCoverageSources.companyId === activeCompany?.id && ['users', 'departments', 'schedules', 'absences'].every(source => scheduleCoverageSources[source] === 'ready');
  const finishAutomaticScheduleGeneration = (proposal, dates) => {
    setAutomaticScheduleProblem(null);
    const preserved = prepareScheduleProposal(proposal, { history: workSchedules, absences, rules: automaticScheduleRules, draftPins: automaticScheduleProposal });
    const prepared = balancePreparedScheduleProposal(preserved, proposal, scheduleScopedCoverageRequirements, schedulePlanningContext());
    if (!automaticScheduleRules.ruleGroups?.length && automaticScheduleRules.calculateExtraAutomatically) {
      const groups = new Map();
      prepared.forEach(row => { const key = row.userId + '|' + row.weekKey; groups.set(key, [...(groups.get(key) || []), row]); });
      for (const rows of groups.values()) {
        if (rows.some(row => ['Presencial', 'Home Office'].includes(row.status) && (!row.shiftStart || !row.shiftEnd))) continue;
        const target = Number(rows[0].weekHoursTarget) || 0;
        let remaining = Math.max(0, target - rows.reduce((sum, row) => sum + automaticScheduleRowHours(row).total, 0));
        rows.filter(row => ['Presencial', 'Home Office'].includes(row.status) && !isFixedProposalRow(row)).reverse().forEach(row => {
          const assigned = Math.min(Math.max(0, Number(row.maxExtraHoursPerDay ?? automaticScheduleRules.maxExtraHoursPerDay) - Number(row.extraHours || 0)), remaining);
          if (assigned > 0) { row.extraHours = Number((Number(row.extraHours || 0) + assigned).toFixed(2)); row.autoExtra = true; remaining -= assigned; }
        });
        rows.forEach(row => { row.unallocatedHours = Number(Math.max(0, remaining).toFixed(2)); });
      }
    }
    const result = buildCoverageFirstProposal(prepared, scheduleScopedCoverageRequirements, schedulePlanningContext());
    setAutomaticScheduleProposalInput(automaticScheduleInput);
    setAutomaticScheduleProposal(result.rows);
    setAutomaticScheduleOptimization({ before: result.before, swaps: result.swaps, limited: result.limited });
    setAutomaticSchedulePreviewDate(dates[0] || '');
    triggerNotification(`Simulação criada: ${result.swaps} troca(s) de folga para melhorar a cobertura. Revise antes de publicar.`);
  };
  const reorganizeAutomaticSchedule = () => {
    if (!schedulePlanningDataReady() || automaticScheduleProposalInput !== automaticScheduleInput) return triggerNotification('Os dados ou as regras mudaram. Gere o quadro novamente antes de reorganizar.', 'error');
    const result = optimizeScheduleCoverage(automaticScheduleProposal, scheduleScopedCoverageRequirements, schedulePlanningContext());
    setAutomaticScheduleProposal(result.rows);
    setAutomaticScheduleOptimization({ before: result.before, swaps: result.swaps, limited: result.limited });
    triggerNotification(result.swaps ? `${result.swaps} troca(s) aplicadas na prévia. ${result.after.gaps ? 'Confira os dias que ainda precisam de cobertura.' : 'Mínimo de pessoas atendido. Revise antes de publicar.'}` : result.limited ? 'O limite da busca foi atingido. Tente continuar a correção ou revise as pendências por dia.' : 'A busca não encontrou melhoria. Abra as pendências por dia para revisar turnos, folgas fixas e disponibilidade.');
  };
  const reviewAutomaticScheduleDay = date => {
    setAutomaticSchedulePreviewDate(date);
    automaticScheduleDayEditorRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    automaticScheduleDayEditorRef.current?.focus({ preventScroll: true });
  };
  const openAutomaticScheduleProblem = issue => {
    if (issue.key === 'stale') { setAutomaticScheduleRuleTab('planning'); triggerNotification('As regras ou os dados mudaram. Gere uma nova prévia para conferir a escala atual.', 'error'); return; }
    const target = scheduleIssueTarget(issue, automaticScheduleProposal);
    if (!target) return;
    setAutomaticSchedulePreviewDate(target.date);
    setAutomaticScheduleProblem({ ...target, token: globalThis.crypto.randomUUID() });
  };
  const restoreAutomaticScheduleDraft = async saved => {
    validateScheduleDraftScope(saved, scheduleScope);
    if (!isManager || (!currentUser.isAdmin && !currentUser.isDeveloper && (effectiveAccessProfile.canEdit === false || effectiveAccessProfile.canManageCalendar === false))) throw new Error('Seu perfil não pode editar escalas.');
    setAutomaticScheduleProblem(null);
    setBulkSchedule(previous => ({ ...previous, ...saved.bulk }));
    setAutomaticScheduleHolidayDraft({ companyId: activeCompany.id, assignments: saved.holidayAssignments || {} });
    setAutomaticScheduleProposal(saved.rows);
    setAutomaticScheduleProposalInput('draft-restored');
    setAutomaticScheduleWeeklyHoursText(saved.weeklyHours || '40:00');
    setAutomaticSchedulePreviewDate(saved.selectedDate || saved.bulk.startDate);
    setAutomaticScheduleOptimization(null);
    setAutomaticScheduleRuleTab('planning');
    setBulkScheduleMode('smart');
    setAutomaticScheduleDraftRestore({ companyId: activeCompany.id, inputHash: saved.inputHash });
  };
  const toggleAutomaticScheduleDayLock = key => {
    setAutomaticScheduleProposal(previous => previous.map(row => row.key !== key || isProtectedProposalRow(row) || row.pinned || row.ruleApplied || row.constraintLocked ? row : { ...row, locked: !(row.locked || row.manuallyAdjusted), manuallyAdjusted: false }));
  };

  const generateAutomaticSchedule = () => {
    if (!schedulePlanningDataReady()) return triggerNotification('Aguarde o carregamento das regras, equipe e ausências antes de gerar.', 'error');
    if (!bulkSchedule.startDate || !bulkSchedule.endDate || bulkSchedule.endDate < bulkSchedule.startDate) {
      triggerNotification('Informe um período válido para gerar a sugestão.', 'error');
      return;
    }
    const targets = scheduleScope.employees.filter(user => bulkSchedule.userIds.includes(user.id));
    if (!targets.length) return triggerNotification('Selecione pelo menos um colaborador.', 'error');
    const dayCount = civilDateDaysInclusive(bulkSchedule.startDate, bulkSchedule.endDate);
    if (!dayCount || dayCount > 31) return triggerNotification('Para revisar a sugestão com clareza, gere no máximo 31 dias por vez.', 'error');
    const workDays = Math.max(1, Math.min(7, Number(automaticScheduleRules.workDaysPerWeek) || 5));
    const restEvery = Math.max(2, Math.min(14, Number(automaticScheduleRules.restEveryDays) || 7));
    if (!/^\d{1,3}:[0-5]\d$/.test(automaticScheduleWeeklyHoursText)) return triggerNotification('Informe a carga semanal no formato hh:mm antes de gerar a escala.', 'error');
    const weeklyHours = Math.max(1, Math.min(84, scheduleTextToHours(automaticScheduleWeeklyHoursText) || Number(automaticScheduleRules.hoursPerWeek) || 40));
    const configurationAudit = auditScheduleConfiguration({ ...automaticScheduleRules, hoursPerWeek: weeklyHours });
    if (configurationAudit.errors.length) {
      if (canConfigureScheduleRules) setAutomaticScheduleRuleTab('rules');
      return triggerNotification(configurationAudit.errors[0].message, 'error');
    }
    const breakMinutes = scheduleIntervalMinutes(automaticScheduleRules.breakStart, automaticScheduleRules.breakEnd);
    if (breakMinutes <= 0 || breakMinutes > 360) return triggerNotification('Defina um intervalo válido, com horário de início e fim, antes de gerar a escala.', 'error');
    if (workDays >= restEvery) return triggerNotification('As regras são incompatíveis: reduza os dias trabalhados ou aumente o intervalo de descanso.', 'error');
    const allowedWeekdays = new Set(automaticScheduleRules.allowedWeekdays || []);
    if (allowedWeekdays.size < workDays) return triggerNotification('Selecione dias da semana suficientes para cumprir os dias de trabalho definidos.', 'error');
    const allDays = Array.from({ length: dayCount }, (_, index) => civilDateShift(bulkSchedule.startDate, { days: index }));
    const holidayDates = new Set(calendarEvents.filter(event => normalizedText(`${event.type || ''} ${event.title || ''}`).includes('feriado')).map(event => event.date));
    const holidayError = validateHolidayAssignments(automaticScheduleHolidayAssignments, allDays.filter(date => holidayDates.has(date)), targets.map(user => String(user.id)));
    if (holidayError) return triggerNotification(holidayError, 'error');
    const shiftError = validateScheduleShifts(automaticScheduleRules.shifts || [], automaticScheduleRules.ruleGroups || []);
    if (shiftError) return triggerNotification(shiftError, 'error');
    const ruleErrors = validateRuleGroups(automaticScheduleRules.ruleGroups || []);
    if (ruleErrors.length) return triggerNotification(ruleErrors[0], 'error');
    if (automaticScheduleRules.ruleGroups?.length || automaticScheduleRules.shifts?.length || automaticScheduleRules.coverageRequirements?.length || allDays.some(date => holidayDates.has(date))) {
      const proposal = buildRuleSchedule({ dates: allDays, users: targets, rules: { ...automaticScheduleRules, hoursPerWeek: weeklyHours, holidayAssignments: automaticScheduleHolidayAssignments }, holidays: [...holidayDates], history: workSchedules, getDepartment: user => scheduleDepartmentForEmployee(user, scheduleScope, getUserDepts) });
      finishAutomaticScheduleGeneration(proposal, allDays);
      return;
    }
    const proposal = targets.flatMap((user, userIndex) => {
      const employeeProposal = [];
      const employeeOverride = automaticScheduleRules.employeeOverrides?.[user.id] || {};
      const weekGroups = new Map();
      allDays.forEach(date => {
        const weekday = new Date(`${date}T00:00:00`).getDay();
        const mondayOffset = (weekday + 6) % 7;
        const weekStart = civilDateShift(date, { days: -mondayOffset });
        weekGroups.set(weekStart, [...(weekGroups.get(weekStart) || []), date]);
      });
      [...weekGroups.entries()].forEach(([weekStart, dates], weekIndex) => {
        const holidayDays = dates.filter(date => holidayDates.has(date));
        const availableDays = dates.filter(date => (!holidayDates.has(date) || !automaticScheduleRules.holidaysCountAsRest) && allowedWeekdays.has(new Date(`${date}T00:00:00`).getDay()));
        const baseRestDays = Math.max(0, dates.length - workDays, Math.floor(dates.length / restEvery));
        const remainingRestDays = Math.max(0, baseRestDays - (automaticScheduleRules.holidaysCountAsRest ? holidayDays.length : 0));
        const plannedWorkDays = Math.min(workDays, Math.max(0, availableDays.length - remainingRestDays));
        const weekKey = weekStart;
        const targetWeekHours = weeklyHours * Math.min(1, dates.length / 7);
        const restCount = Math.max(0, availableDays.length - plannedWorkDays);
        const restSet = new Set();
        const restStep = restCount ? Math.max(1, Math.floor(availableDays.length / restCount)) : 1;
        for (let offset = 0; offset < restCount; offset += 1) restSet.add(availableDays[(userIndex + weekIndex + offset * restStep) % availableDays.length]);
        const workSet = new Set(availableDays.filter(date => !restSet.has(date)).slice(0, plannedWorkDays));
        const weekRows = [];
        dates.forEach(date => {
          const holiday = holidayDates.has(date);
          const status = holiday && automaticScheduleRules.holidaysCountAsRest ? 'Folga' : (workSet.has(date) ? 'Presencial' : 'Folga');
          const isWorkDay = status === 'Presencial';
          const weekday = new Date(`${date}T00:00:00`).getDay();
          const latestWorkSchedule = automaticScheduleRules.reuseLastSchedule ? previousScheduleForDate(user.id, date, workSchedules, bulkSchedule.startDate) : null;
          const template = holidayWorkTemplate(user.id, date, automaticScheduleRules, workSchedules, bulkSchedule.startDate);
          const defaultShiftStart = template.shiftStart, defaultShiftEnd = template.shiftEnd;
          const defaultBreakStart = template.breakStart, defaultBreakEnd = template.breakEnd;
          const employeeBreakMinutes = template.breakMinutes;
          const dayShiftEnd = weekday === 6 && employeeOverride.saturdayEnd ? employeeOverride.saturdayEnd : defaultShiftEnd;
          const usesInterval = isWorkDay && scheduleTimeWithinShift(defaultBreakStart, defaultShiftStart, dayShiftEnd) && scheduleTimeWithinShift(defaultBreakEnd, defaultShiftStart, dayShiftEnd);
          weekRows.push({
            key: `${user.id}-${date}`, userId: user.id, userName: user.name,
            dept: scheduleDepartmentForEmployee(user, scheduleScope, getUserDepts), date, status,
            shiftStart: isWorkDay ? defaultShiftStart : '',
            shiftEnd: isWorkDay ? dayShiftEnd : '',
            breakStart: usesInterval ? defaultBreakStart : '',
            breakEnd: usesInterval ? defaultBreakEnd : '',
            breakMinutes: usesInterval ? employeeBreakMinutes : 0,
            extraHours: 0,
            shift: isWorkDay ? `${defaultShiftStart}–${dayShiftEnd}` : status,
            workTemplate: template, reusedPattern: Boolean(latestWorkSchedule),
            sourceScheduleId: latestWorkSchedule?.id || '',
            holiday, holidayDaysInWeek: holidayDays.length,
            weekKey, weekHoursTarget: Number(targetWeekHours.toFixed(2)), plannedWorkDays,
            minRestHours: automaticScheduleRules.minRestHours, maxDailyHours: automaticScheduleRules.maxDailyHours, maxWeeklyHours: automaticScheduleRules.maxWeeklyHours,
            maxExtraHoursPerDay: automaticScheduleRules.maxExtraHoursPerDay, limitSeverity: automaticScheduleRules.limitSeverity,
            rulesVersion: automaticScheduleRules.version, rulesName: automaticScheduleRules.name, profileName: 'Padrão da empresa',
          });
        });
        if (automaticScheduleRules.calculateExtraAutomatically) {
          const baseHours = weekRows.reduce((sum, row) => sum + automaticScheduleRowHours(row).regular, 0);
          let remainingExtra = Math.max(0, targetWeekHours - baseHours);
          weekRows.filter(row => ['Presencial', 'Home Office'].includes(row.status)).reverse().forEach(row => {
            if (remainingExtra <= 0) return;
            const assigned = Math.min(Number(automaticScheduleRules.maxExtraHoursPerDay) || 0, remainingExtra);
            row.extraHours = Number(assigned.toFixed(2));
            row.autoExtra = assigned > 0;
            remainingExtra -= assigned;
          });
          weekRows.forEach(row => { row.unallocatedHours = Number(Math.max(0, remainingExtra).toFixed(2)); });
        }
        employeeProposal.push(...weekRows);
      });
      return employeeProposal;
    });
    finishAutomaticScheduleGeneration(proposal, allDays);
  };

  const saveAutomaticScheduleProposal = async () => {
    if (isSavingScheduleProposal || !isManager || !automaticScheduleProposal.length) return;
    if (!currentUser.isAdmin && !currentUser.isDeveloper && (effectiveAccessProfile.canEdit === false || effectiveAccessProfile.canManageCalendar === false)) return triggerNotification('Seu perfil não pode publicar escalas.', 'error');
    if (!schedulePlanningDataReady()) return triggerNotification('Aguarde a confirmação dos dados da empresa.', 'error');
    if (automaticScheduleProposalInput !== automaticScheduleInput) return triggerNotification('As regras ou o período mudaram. Gere uma nova simulação antes de publicar.', 'error');
    const ruleIssues = scheduleRuleIssues(automaticScheduleProposal, workSchedules).filter(issue => issue.blocking);
    if (ruleIssues.length) {
      openAutomaticScheduleProblem(ruleIssues[0]);
      return triggerNotification(ruleIssues[0].message, 'error');
    }
    if (automaticScheduleRules.coverageRequirements?.length) {
      const coverage = analyzeProposalCoverage(automaticScheduleProposal, scheduleScopedCoverageRequirements, schedulePlanningContext());
      if (coverage.missingMinutes || coverage.unknown) {
        const firstGap = coverage.days.find(day => day.rules.some(rule => rule.unknown || rule.segments.some(segment => segment.missing)));
        if (firstGap) {
          const requirement = firstGap.rules.find(rule => rule.unknown || rule.segments.some(segment => segment.missing));
          const missing = requirement.segments.find(segment => segment.missing);
          const candidate = automaticScheduleProposal.find(row => row.date === firstGap.date && row.dept === requirement.department && !isProtectedProposalRow(row) && row.status === 'Folga') || automaticScheduleProposal.find(row => row.date === firstGap.date && row.dept === requirement.department);
          if (candidate && !requirement.unknown) openAutomaticScheduleProblem({ rowKey: candidate.key, date: firstGap.date, field: 'status', code: 'coverage', message: missing ? `Faltam ${missing.missing} pessoa(s) entre ${missing.start} e ${missing.end}.` : 'Há horários incompletos na cobertura deste dia.', hint: 'Use a correção automática ou ajuste a situação e o turno de pessoas deste setor, respeitando as folgas e os limites.' });
          else reviewAutomaticScheduleDay(firstGap.date);
        }
        return triggerNotification('A escala ainda tem falta de pessoas ou horários incompletos. Revise a cobertura antes de publicar.' + (coverage.unknown ? ' Confira os horários das marcações já existentes no calendário deste setor.' : ''), 'error');
      }
    }
    const invalidWorkRows = automaticScheduleProposal.filter(item => {
      if (isProtectedProposalRow(item) || !['Presencial', 'Home Office'].includes(item.status)) return false;
      const hours = automaticScheduleRowHours(item);
      const hasIncompleteBreak = Boolean(item.breakStart) !== Boolean(item.breakEnd);
      const hasInvalidBreak = Boolean(item.breakStart && item.breakEnd) && (hours.breakMinutes <= 0 || hours.breakMinutes > 360 || !scheduleTimeWithinShift(item.breakStart, item.shiftStart, item.shiftEnd) || !scheduleTimeWithinShift(item.breakEnd, item.shiftStart, item.shiftEnd));
      return !item.shiftStart || !item.shiftEnd || hours.regular <= 0 || hasIncompleteBreak || hasInvalidBreak;
    });
    if (invalidWorkRows.length) {
      triggerNotification(`Revise ${invalidWorkRows.length} jornada(s) com horário ou carga inválida antes de publicar.`, 'error');
      openAutomaticScheduleProblem(scheduleRowFieldIssues(invalidWorkRows[0])[0] || { rowKey: invalidWorkRows[0].key, date: invalidWorkRows[0].date, field: 'shiftEnd', message: 'Confira a jornada e o intervalo deste dia.', hint: 'A entrada e a saída precisam comportar o intervalo informado.' });
      return;
    }
    const rows = automaticScheduleProposal.filter(item => !isProtectedProposalRow(item)).slice().sort((a, b) => a.userId.localeCompare(b.userId) || a.date.localeCompare(b.date));
    const segments = [];
    rows.forEach(item => {
      const hours = automaticScheduleRowHours(item);
      const previous = segments[segments.length - 1];
      const nextDate = previous ? civilDateShift(previous.endDate, { days: 1 }) : '';
      if (previous && previous.locked === Boolean(item.locked || item.manuallyAdjusted) && previous.manuallyAdjusted === Boolean(item.manuallyAdjusted) && previous.ruleApplied === Boolean(item.ruleApplied) && previous.ruleReason === (item.ruleReason || '') && previous.ruleGroupId === (item.groupId || '') && previous.rulesVersion === Number(item.rulesVersion || automaticScheduleRules.version || 1) && previous.profileName === (item.profileName || item.groupName || 'Padrão da empresa') && previous.userId === item.userId && previous.status === item.status && previous.shiftStart === item.shiftStart && previous.baseShiftEnd === item.shiftEnd && previous.breakStart === item.breakStart && previous.breakEnd === item.breakEnd && previous.extraHours === hours.extra && nextDate === item.date) {
        previous.endDate = item.date;
      } else {
        segments.push({
          id: `schedule-${item.userId}-${item.date}-${item.date}`,
          userId: item.userId, userName: item.userName, dept: item.dept,
          ruleReason: item.ruleReason || '', ruleGroupId: item.groupId || '', ruleGroupName: item.groupName || '',
          rulesVersion: Number(item.rulesVersion || automaticScheduleRules.version || 1), rulesName: item.rulesName || automaticScheduleRules.name, profileName: item.profileName || item.groupName || 'Padrão da empresa',
          restEveryDays: Number(item.restEveryDays || automaticScheduleRules.restEveryDays), workDaysPerWeek: Number(item.workDaysPerWeek || automaticScheduleRules.workDaysPerWeek),
          minRestHours: Number(item.minRestHours ?? automaticScheduleRules.minRestHours), maxDailyHours: Number(item.maxDailyHours || automaticScheduleRules.maxDailyHours),
          maxWeeklyHours: Number(item.maxWeeklyHours || automaticScheduleRules.maxWeeklyHours), maxExtraHoursPerDay: Number(item.maxExtraHoursPerDay ?? automaticScheduleRules.maxExtraHoursPerDay), limitSeverity: item.limitSeverity || automaticScheduleRules.limitSeverity,
          ruleApplied: Boolean(item.ruleApplied), manuallyAdjusted: Boolean(item.manuallyAdjusted), locked: Boolean(item.locked || item.manuallyAdjusted),
          startDate: item.date, endDate: item.date, status: item.status,
          shift: ['Presencial', 'Home Office'].includes(item.status) ? `${item.shiftStart}–${hours.actualEnd}` : item.status,
          shiftStart: item.shiftStart, baseShiftEnd: item.shiftEnd, shiftEnd: hours.actualEnd,
          breakStart: item.breakStart || '', breakEnd: item.breakEnd || '', breakMinutes: hours.breakMinutes,
          regularHours: Number(hours.regular.toFixed(2)), extraHours: Number(hours.extra.toFixed(2)), plannedHours: Number(hours.total.toFixed(2)),
          notes: `${bulkSchedule.notes.trim()}${item.status === 'Feriado' ? ' · Feriado não contabilizado como descanso' : ''}`.trim(),
        });
      }
    });
    const now = Date.now();
    const publicationId = globalThis.crypto.randomUUID();
    const schedules = segments.map((segment, index) => {
      const id = `schedule-${publicationId}-${index}`;
      return { ...segment, id, createdAt: now, updatedAt: now, updatedBy: currentUser.name, autoGenerated: true };
    });
    let plan;
    try { plan = planSchedulePublication(automaticScheduleProposal, workSchedules, schedules, publicationId); }
    catch (error) { return triggerNotification(error.message, 'error'); }
    if (!plan.records.length) return triggerNotification('Este período contém apenas marcações preservadas. Nenhuma alteração é necessária.');
    setIsSavingScheduleProposal(true);
    try {
      if (!await saveRelatedRecords(plan.records, 'Não foi possível publicar a reorganização. Nenhuma alteração foi confirmada.', { companyId: activeCompany.id, history: workSchedules, replaced: plan.replaced })) return;
      const removedIds = new Set(plan.deletedIds);
      const createdIds = new Set(plan.schedules.map(item => item.id));
      setWorkSchedules(previous => [...plan.schedules, ...previous.filter(item => !removedIds.has(item.id) && !createdIds.has(item.id))]);
      setAutomaticScheduleProposal([]);
      setAutomaticScheduleOptimization(null);
      setShowBulkScheduleModal(false);
      triggerNotification('Escala publicada. Dias manuais e marcações fora do período foram preservados.');
    } finally { setIsSavingScheduleProposal(false); }
  };

  const saveBulkSchedule = async (event) => {
    event.preventDefault();
    if (!isManager) {
      triggerNotification('Apenas gestores podem alterar escalas em lote.', 'error');
      return;
    }
    if (bulkSchedule.endDate < bulkSchedule.startDate) {
      triggerNotification('A data final da escala não pode ser anterior à inicial.', 'error');
      return;
    }
    const targets = scheduleScope.employees.filter(user => bulkSchedule.userIds.includes(user.id));
    if (!targets.length) {
      triggerNotification('Selecione pelo menos um colaborador para a escala.', 'error');
      return;
    }
    const now = Date.now();
    const occurrences = bulkScheduleOccurrences();
    const schedules = targets.flatMap(user => occurrences.map(period => {
      const id = `schedule-${user.id}-${period.startDate}-${period.endDate}`;
      const existing = workSchedules.find(schedule => schedule.id === id);
      return {
        id,
        userId: user.id,
        userName: user.name,
        dept: scheduleDepartmentForEmployee(user, scheduleScope, getUserDepts),
        startDate: period.startDate,
        endDate: period.endDate,
        status: bulkSchedule.status,
        locked: true, manuallyAdjusted: true, autoGenerated: false,
        shift: bulkSchedule.shift || 'Integral',
        shiftStart: bulkSchedule.shift === 'Personalizado' ? bulkSchedule.customShiftStart : '',
        shiftEnd: bulkSchedule.shift === 'Personalizado' ? bulkSchedule.customShiftEnd : '',
        recurrence: occurrences.length > 1 ? { total: occurrences.length, interval: bulkSchedule.repeatInterval } : null,
        notes: bulkSchedule.notes.trim(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        updatedBy: currentUser.name,
      };
    }));
    if (!await saveRelatedRecords(schedules.map(schedule => ({
      collection: 'schedules', id: schedule.id, data: schedule,
      ...(workSchedules.some(item => item.id === schedule.id) ? { operation: 'update' } : {}),
    })), 'Não foi possível salvar a escala em lote. Nenhuma alteração foi confirmada.')) return;
    const ids = new Set(schedules.map(schedule => schedule.id));
    setWorkSchedules(previous => [...schedules, ...previous.filter(schedule => !ids.has(schedule.id))]);
    setShowBulkScheduleModal(false);
    triggerNotification(`Escala atualizada para ${schedules.length} colaborador(es).`);
  };

  const openPublishedScheduleSwap = (source, date) => {
    if ((!isManager && !currentUser?.isAdmin && !currentUser?.isDeveloper) || (!currentUser.isAdmin && !currentUser.isDeveloper && (effectiveAccessProfile.canEdit === false || effectiveAccessProfile.canManageCalendar === false))) return triggerNotification('Seu perfil não pode trocar escalas.', 'error');
    if (!canEditPublishedSchedule(source) || !schedulePlanningDataReady()) return triggerNotification('Aguarde os dados da empresa. A troca usa apenas escalas publicadas.', 'error');
    setPublishedScheduleSwap({ source, date, companyId: activeCompany.id, history: workSchedules, absences, rules: automaticScheduleRules });
  };
  const openPublishedScheduleSwapRequest = (source, date) => {
    if (String(source?.userId) !== String(currentUser?.id) || !canEditPublishedSchedule(source)) return triggerNotification('Você só pode solicitar a troca de um dia da sua própria escala.', 'error');
    if (!schedulePlanningDataReady()) return triggerNotification('Aguarde o carregamento completo do calendário.', 'error');
    setPublishedScheduleSwapRequest({ source, date, companyId: activeCompany.id, history: workSchedules, absences, rules: automaticScheduleRules });
  };
  const submitPublishedScheduleSwapRequest = async ({ target, targetDate, reason }) => {
    if (isSavingScheduleSwapRequest || !publishedScheduleSwapRequest || !isFirebaseAvailable || !dbUser) return false;
    const request = publishedScheduleSwapRequest;
    if (request.companyId !== activeCompany?.id || String(request.source.userId) !== String(currentUser?.id) || scheduleSignature(workSchedules) !== scheduleSignature(request.history)) { triggerNotification('A escala mudou. Feche e abra novamente para solicitar a troca.', 'error'); return false; }
    let data;
    try { data = buildScheduleSwapRequest({ id: `swap-${globalThis.crypto.randomUUID()}`, source: request.source, sourceDate: request.date, target, targetDate, requester: currentUser, reason, history: workSchedules, absences, rules: automaticScheduleRules, existing: scheduleSwapRequests, now: Date.now() }); }
    catch (error) { triggerNotification(error.message, 'error'); return false; }
    setIsSavingScheduleSwapRequest(true);
    try {
      const { id, ...payload } = data;
      await setDoc(doc(getTenantCollection('scheduleSwapRequests'), id), payload);
      await recordAuditEvent({ action: 'schedule.swap_requested', collectionName: 'scheduleSwapRequests', documentId: id, fields: Object.keys(payload) });
      setPublishedScheduleSwapRequest(null);
      triggerNotification(`Solicitação enviada para ${target.userName}.`);
      return true;
    } catch (error) {
      console.error('Falha ao solicitar troca de escala', error);
      triggerNotification('Não foi possível enviar a solicitação. Nada foi alterado.', 'error');
      return false;
    } finally { setIsSavingScheduleSwapRequest(false); }
  };
  const updateScheduleSwapRequest = async (request, action) => {
    if (isSavingScheduleSwapRequest || !request?.id || !isFirebaseAvailable || !dbUser) return false;
    const managerAction = action === 'reject-manager';
    if (managerAction && ((!isManager && !currentUser?.isAdmin && !currentUser?.isDeveloper) || (!currentUser.isAdmin && !currentUser.isDeveloper && effectiveAccessProfile.canManageCalendar === false))) return triggerNotification('Seu perfil não pode decidir solicitações de troca.', 'error');
    let patch;
    try { patch = swapRequestPatch(request, action, currentUser, Date.now()); }
    catch (error) { triggerNotification(error.message, 'error'); return false; }
    setIsSavingScheduleSwapRequest(true);
    try {
      await updateDoc(doc(getTenantCollection('scheduleSwapRequests'), request.id), patch);
      await recordAuditEvent({ action: `schedule.swap_${patch.status}`, collectionName: 'scheduleSwapRequests', documentId: request.id, fields: Object.keys(patch) });
      triggerNotification(patch.status === 'pending_manager' ? 'Troca aceita e enviada ao gestor.' : patch.status === 'cancelled' ? 'Solicitação cancelada.' : 'Solicitação recusada.');
      return true;
    } catch (error) {
      console.error('Falha ao atualizar solicitação de troca', error);
      triggerNotification('Não foi possível atualizar a solicitação.', 'error');
      return false;
    } finally { setIsSavingScheduleSwapRequest(false); }
  };
  const reviewScheduleSwapRequest = request => {
    if (!isManager && !currentUser?.isAdmin && !currentUser?.isDeveloper) return triggerNotification('Apenas gestores podem aprovar trocas.', 'error');
    const resolved = resolveScheduleSwapRequest(request, workSchedules);
    if (!resolved.valid) return triggerNotification(resolved.message, 'error');
    setPublishedScheduleSwap({ source: resolved.source, date: request.sourceDate, targetUserId: request.targetUserId, targetDate: request.targetDate, reason: request.reason, requestId: request.id, requestUpdatedAt: request.updatedAt, companyId: activeCompany.id, history: workSchedules, absences, rules: automaticScheduleRules });
  };
  const saveApprovedScheduleSwap = async (plan, swap) => {
    const finishActivity = typeof beginCloudActivity === 'function' ? (beginCloudActivity('Aprovando troca de escala...'), endCloudActivity) : () => {};
    try {
      if (!isFirebaseAvailable || !dbUser || plan.records.length > 450 || plan.records.some(record => record.collection !== 'schedules')) throw new Error('Aprovação inválida.');
      const schedulesCollection = getTenantCollection('schedules');
      const requestsCollection = getTenantCollection('scheduleSwapRequests');
      const fresh = await getDocsFromServer(scopedScheduleSource(schedulesCollection, scheduleScope, { query, where }));
      const currentSchedules = fresh.docs.map(item => ({ id: item.id, ...item.data() }));
      if (scheduleSignature(currentSchedules) !== scheduleSignature(swap.history)) throw Object.assign(new Error('Escalas alteradas durante a revisão'), { code: 'planning-stale' });
      const approvedAt = Date.now();
      await runTransaction(db, async transaction => {
        const requestRef = doc(requestsCollection, swap.requestId);
        const [requestSnapshot, ...checks] = await Promise.all([transaction.get(requestRef), ...plan.replaced.map(item => transaction.get(doc(schedulesCollection, item.id)))]);
        if (!requestSnapshot.exists() || requestSnapshot.data().status !== 'pending_manager' || Number(requestSnapshot.data().updatedAt) !== Number(swap.requestUpdatedAt)) throw Object.assign(new Error('Solicitação alterada durante a revisão'), { code: 'planning-stale' });
        if (checks.some((snapshot, index) => !snapshot.exists() || scheduleSignature([{ id: snapshot.id, ...snapshot.data() }]) !== scheduleSignature([plan.replaced[index]]))) throw Object.assign(new Error('Uma escala foi alterada durante a aprovação'), { code: 'planning-stale' });
        for (const record of plan.records) {
          const reference = doc(schedulesCollection, record.id);
          if (record.operation === 'delete') transaction.delete(reference);
          else transaction.set(reference, record.data);
        }
        transaction.update(requestRef, { status: 'approved', reviewedAt: approvedAt, reviewedById: String(currentUser.id || dbUser.uid), reviewedByName: currentUser.name || 'Gestor', updatedAt: approvedAt });
      });
      await Promise.all([...plan.records.map(record => recordAuditEvent({ action: record.operation === 'delete' ? 'record.deleted' : record.operation === 'update' ? 'record.updated' : 'record.created', collectionName: 'schedules', documentId: record.id, fields: Object.keys(record.data || {}) })), recordAuditEvent({ action: 'schedule.swap_approved', collectionName: 'scheduleSwapRequests', documentId: swap.requestId, fields: ['status', 'reviewedAt', 'reviewedById', 'reviewedByName'] })]);
      return true;
    } catch (error) {
      console.error('Falha ao aprovar troca de escala', error);
      triggerNotification(error?.code === 'planning-stale' ? 'A solicitação ou a escala mudou em outra sessão. Nada foi alterado.' : 'Não foi possível aprovar a troca. Nenhum dia foi alterado.', 'error');
      return false;
    } finally { finishActivity(); }
  };
  const savePublishedScheduleSwap = async ({ target, targetDate, reason }) => {
    if (isSavingPublishedSchedule || !publishedScheduleSwap) return false;
    if ((!isManager && !currentUser?.isAdmin && !currentUser?.isDeveloper) || (!currentUser.isAdmin && !currentUser.isDeveloper && (effectiveAccessProfile.canEdit === false || effectiveAccessProfile.canManageCalendar === false))) { triggerNotification('Seu perfil não pode trocar escalas.', 'error'); return false; }
    const swap = publishedScheduleSwap;
    if (!schedulePlanningDataReady() || swap.companyId !== activeCompany?.id) { triggerNotification('Aguarde os dados da empresa correta antes de salvar.', 'error'); return false; }
    if (scheduleSignature(workSchedules) !== scheduleSignature(swap.history) || JSON.stringify(absences) !== JSON.stringify(swap.absences) || JSON.stringify(automaticScheduleRules) !== JSON.stringify(swap.rules)) { triggerNotification('Os dados mudaram. Feche e abra novamente esta troca para revisar a versão atual.', 'error'); return false; }
    let plan;
    try { plan = planPublishedScheduleSwap(swap.source, swap.date, target, targetDate, { history: workSchedules, absences, rules: automaticScheduleRules, publicationId: globalThis.crypto.randomUUID(), now: Date.now(), actor: { id: currentUser.id || dbUser.uid, name: currentUser.name }, reason }); }
    catch (error) { triggerNotification(error.message, 'error'); return false; }
    setIsSavingPublishedSchedule(true);
    try {
      const saved = swap.requestId
        ? await saveApprovedScheduleSwap(plan, swap)
        : await saveRelatedRecords(plan.records, 'Não foi possível salvar a troca. Nenhum dia foi alterado; sua revisão foi preservada.', { companyId: swap.companyId, history: swap.history, replaced: plan.replaced });
      if (!saved) return false;
      const replacedIds = new Set(plan.replaced.map(item => item.id));
      setWorkSchedules(previous => [...previous.filter(item => !replacedIds.has(item.id)), ...plan.schedules]);
      setPublishedScheduleSwap(null);
      triggerNotification(swap.requestId ? 'Solicitação aprovada e troca aplicada nos dois dias.' : 'Troca salva nos dois dias. O restante das escalas foi preservado.');
      return true;
    } finally { setIsSavingPublishedSchedule(false); }
  };

  const openPublishedScheduleEdit = (source, date) => {
    if ((!isManager && !currentUser?.isAdmin && !currentUser?.isDeveloper) || (!currentUser.isAdmin && !currentUser.isDeveloper && (effectiveAccessProfile.canEdit === false || effectiveAccessProfile.canManageCalendar === false))) return triggerNotification('Seu perfil não pode editar escalas.', 'error');
    if (!canEditPublishedSchedule(source) || !schedulePlanningDataReady()) return triggerNotification('Aguarde os dados da empresa. Ausências e férias são alteradas na aba própria.', 'error');
    setPublishedScheduleEdit({ source, date, companyId: activeCompany.id, history: workSchedules, absences, rules: automaticScheduleRules });
  };
  const savePublishedScheduleEdit = async …133469 tokens truncated…g><span className="text-[10px] text-slate-500">ainda não acessaram</span></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Filter className="h-5 w-5 text-violet-600" /><span className="mt-3 block text-[10px] font-bold uppercase text-slate-400">Para completar</span><strong className="mt-1 block text-2xl font-black text-slate-900">{peopleOverview.incompleteProfile}</strong><span className="text-[10px] text-slate-500">sem cargo ou setor</span></div>
                  </div>
                  <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-extrabold text-slate-800">Cadastros que precisam de atenção</h4><p className="mt-1 text-xs text-slate-500">Ajuste vínculo, cargo ou acompanhe quem ainda não fez o primeiro acesso.</p></div><button type="button" onClick={() => setMgmtSubTab('employees')} className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white hover:bg-slate-800">Abrir equipe</button></div>
                      <div className="mt-4 divide-y divide-slate-100">{peopleAttentionList.slice(0, 6).map(user => <div key={user.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><strong className="block truncate text-xs text-slate-800">{user.name}</strong><span className="text-[10px] text-slate-500">{!user.lastLoginAt ? 'Ainda não acessou' : ''}{!user.lastLoginAt && (!user.role || !getUserDepts(user).length) ? ' · ' : ''}{!user.role || !getUserDepts(user).length ? 'Complete cargo e setor' : ''}</span></div><button type="button" onClick={() => { setEmpSearchText(user.name || ''); setMgmtSubTab('employees'); }} className="text-[10px] font-bold text-blue-700 hover:text-blue-900">Ver ficha</button></div>)}{peopleAttentionList.length === 0 && <div className="py-8 text-center text-xs text-emerald-700">Tudo certo: os cadastros da equipe estão completos.</div>}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h4 className="text-sm font-extrabold text-slate-800">Distribuição da equipe</h4><div className="mt-4 space-y-3">{sectorCounts.slice().sort((a,b) => b.count - a.count).slice(0, 5).map(sector => <div key={sector.id}><div className="flex justify-between text-[10px] font-semibold text-slate-600"><span>{sector.name}</span><span>{sector.count}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${peopleOverview.active ? Math.round((sector.count / peopleOverview.active) * 100) : 0}%` }} /></div></div>)}{sectorCounts.length === 0 && <p className="mt-4 text-xs text-slate-500">Cadastre setores para acompanhar a distribuição.</p>}</div></div>
                  </div>
                </div>
              )}

              {mgmtSubTab === 'employees' && (
                <div className="bg-white p-4 sm:p-6 rounded-[26px] border border-slate-200 shadow-[0_18px_50px_-36px_rgba(15,23,42,.55)] flex flex-col gap-5">
                  <div className="rounded-[22px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-5 sm:p-6 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[.18em] text-blue-200">Gestão de pessoas</span>
                      <h3 className="font-black text-white text-xl mt-1">Colaboradores</h3>
                      <p className="text-slate-300 text-xs mt-1">Consulte vínculos, acessos e situações que exigem atenção.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeCompany?.code === '082026' && <button type="button" onClick={handleMigrateLegacyUsers} className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/15">Migrar dados anteriores</button>}
                      <button type="button" onClick={() => { setEditingUser(null); setUserForm({ name: '', role: '', depts: [], avatar: DEFAULT_AVATAR, isAdmin: false, pin: '1234', emergencyName: '', emergencyPhone: '', emergencyRelationship: '', prodGroup: '', managerId: '', birthDate: '', hireDate: '' }); setShowUserModal(true); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-lg transition-all flex-shrink-0"><Plus className="h-4 w-4" /> Novo colaborador</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3.5"><span className="text-[9px] font-black uppercase tracking-wide text-blue-600">Equipe</span><strong className="block text-xl font-black text-blue-950 mt-1">{peopleOverview.active}</strong><span className="text-[10px] text-blue-700">colaboradores ativos</span></div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5"><span className="text-[9px] font-black uppercase tracking-wide text-emerald-600">Ativos recentemente</span><strong className="block text-xl font-black text-emerald-950 mt-1">{peopleOverview.recentlyActive}</strong><span className="text-[10px] text-emerald-700">últimos 7 dias</span></div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3.5"><span className="text-[9px] font-black uppercase tracking-wide text-amber-600">Primeiro acesso</span><strong className="block text-xl font-black text-amber-950 mt-1">{peopleOverview.pendingAccess}</strong><span className="text-[10px] text-amber-700">ainda pendentes</span></div>
                    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3.5"><span className="text-[9px] font-black uppercase tracking-wide text-violet-600">Cadastro incompleto</span><strong className="block text-xl font-black text-violet-950 mt-1">{peopleOverview.incompleteProfile}</strong><span className="text-[10px] text-violet-700">sem cargo ou setor</span></div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={empSearchText}
                        onChange={(e) => setEmpSearchText(e.target.value)}
                        className="pl-9 pr-3 py-2 w-full rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <select
                      value={empSectorFilter}
                      onChange={(e) => setEmpSectorFilter(e.target.value)}
                      className="px-3 py-2 w-full rounded-lg border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="Todos">Todos os Setores</option>
                      {sectorCounts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.count})</option>)}
                    </select>
                    <select
                      value={empRoleFilter}
                      onChange={(e) => setEmpRoleFilter(e.target.value)}
                      className="px-3 py-2 w-full rounded-lg border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="Todos">Todos os Cargos</option>
                      {roleCounts.map(r => <option key={r.name} value={r.name}>{r.name} ({r.count})</option>)}
                    </select>
                    <select
                      value={empProdGroupFilter}
                      onChange={(e) => setEmpProdGroupFilter(e.target.value)}
                      className="px-3 py-2 w-full rounded-lg border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="Todos">Todos os Grupos</option>
                      <option value="">Sem Grupo ({employeesList.filter(u => !u.prodGroup).length})</option>
                      {prodGroupCounts.map(g => <option key={g.name} value={g.name}>{g.name} ({g.count})</option>)}
                    </select>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-xs text-slate-600 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 uppercase font-black tracking-wide text-[9px] border-b border-slate-200">
                          <th className="p-4">Colaborador</th>
                          <th className="p-4">Vínculo</th>
                          <th className="p-4">Último acesso</th>
                          <th className="p-4">Situação</th>
                          <th className="p-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((user) => (
                          <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-all group">
                            <td className="p-4 flex items-center gap-3">
                              <img src={user.avatar || DEFAULT_AVATAR} className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm" alt="" />
                              <div>
                                <strong className="text-slate-900 font-extrabold block">{user.name}</strong>
                                <span className="text-[10px] text-slate-500 block font-medium mt-0.5">{user.isAdmin ? 'Administrador' : 'Colaborador'}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <strong className="block text-[11px] text-slate-800">{user.role || 'Cargo não informado'}</strong>
                              <div className="flex flex-wrap gap-1">
                                {getUserDepts(user).map(dId => (
                                  <span key={dId} className="mt-1 bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200 text-[9px]">
                                    {departmentsList.find(d => d.id === dId)?.name || dId}
                                  </span>
                                ))}
                              </div>
                              {user.prodGroup && <span className="block text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded mt-1 w-max">{user.prodGroup}</span>}
                              <span className="mt-2 block text-[9px] font-semibold text-slate-400">Gestor responsável</span>
                              <span className="block text-[10px] font-bold text-slate-700">{employeesList.find(manager => manager.id === user.managerId)?.name || 'Não definido'}</span>
                            </td>
                            <td className="p-4 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                              {user.lastLoginAt ? <><strong className="block text-slate-700">{new Date(user.lastLoginAt).toLocaleDateString('pt-BR')}</strong><span>{new Date(user.lastLoginAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></> : <span className="font-bold text-amber-700">Ainda não acessou</span>}
                            </td>
                            <td className="p-4">
                              {(!user.role || !getUserDepts(user).length) ? <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-700">Cadastro incompleto</span> : user.lastLoginAt ? <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">Ativo</span> : <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-700">Aguardando acesso</span>}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => handleResetUserPin(user.id, user.name)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-blue-700 transition-all border border-transparent hover:border-blue-100" title="Redefinir PIN"><KeyRound className="h-4 w-4" /></button>
                                <button
                                  type="button"
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                                  title="Editar Informações"
                                >
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingUserRemoval({ id: user.id, name: user.name })}
                                  className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                                  title="Remover Cadastro"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredEmployees.length === 0 && (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-slate-500 italic border-b border-slate-100">
                              Nenhum colaborador encontrado para os filtros selecionados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {mgmtSubTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-slate-800 text-base">Cargos Existentes</h3>
                      <p className="text-slate-500 text-xs">Cargos atualmente configurados por setor de trabalho na Comunica.</p>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                      {rolesList.map((role, idx) => {
                        const isEditing = editingRoleIdx === idx;
                        const roleDepartments = getRoleDepts(role);
                        const count = employeesList.filter(u => u.role === role.name && getUserDepts(u).some(deptId => roleDepartments.includes(deptId))).length;

                        return (
                          <div
                            key={role.id || idx}
                            className="p-3 rounded-xl border border-slate-150 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-all text-xs"
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-2 w-full">
                                <input
                                  type="text"
                                  value={editingRoleValue}
                                  onChange={(e) => setEditingRoleValue(e.target.value)}
                                  className="px-2 py-1 w-full bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                                  autoFocus
                                />
                                <textarea value={editingRoleDescription} onChange={(event) => setEditingRoleDescription(event.target.value)} rows="4" maxLength="2000" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 outline-none focus:border-blue-400" placeholder="Descreva as principais atividades, responsabilidades e requisitos do cargo." />
                                <div className="rounded-xl border border-slate-200 bg-white p-2"><span className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">Setores vinculados</span><div className="flex flex-wrap gap-1.5">{departmentsList.map(dept => <label key={dept.id} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-bold ${editingRoleDepts.includes(dept.id) ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600'}`}><input type="checkbox" checked={editingRoleDepts.includes(dept.id)} onChange={event => setEditingRoleDepts(previous => event.target.checked ? [...new Set([...previous, dept.id])] : previous.filter(id => id !== dept.id))} className="accent-blue-700" />{dept.name}</label>)}</div></div>
                                <div className="flex items-center gap-1.5 w-full justify-end">
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRole(idx)}
                                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingRoleIdx(null); setEditingRoleDepts([]); setEditingRoleDescription(''); }}
                                      className="text-slate-400 hover:text-slate-600 text-[10px]"
                                    >
                                      Sair
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-800">{role.name}</span>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    {roleDepartments.map(deptId => <span key={deptId} className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200">{departmentsList.find(d => d.id === deptId)?.name || deptId}</span>)}
                                    <span className="text-[10px] text-slate-400 font-bold">
                                      • {count} {count === 1 ? 'colaborador' : 'colaboradores'}
                                    </span>
                                  </div>
                                  <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-[10px] leading-4 text-slate-500 [overflow-wrap:anywhere]">{role.description || 'Descrição das atividades ainda não cadastrada.'}</p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleEditRole(idx)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-all"
                                    title="Editar Nome do Cargo"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRole(idx)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-all"
                                    title="Remover Cargo"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="font-black text-slate-850 text-sm">Criar Novo Cargo</h4>
                      <p className="text-slate-500 text-xs">Preencha o cargo e selecione todos os setores em que ele poderá ser utilizado.</p>
                    </div>

                    <form onSubmit={handleAddRole} className="flex flex-col gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título do Cargo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Desenvolvedor Senior"
                          value={newRoleValue}
                          onChange={(e) => setNewRoleValue(e.target.value)}
                          className="px-3.5 py-2 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                        />
                      </div>
                      <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Descritivo das atividades</label><textarea value={newRoleDescription} onChange={(event) => setNewRoleDescription(event.target.value)} rows="5" maxLength="2000" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs leading-5 outline-none focus:ring-2 focus:ring-slate-400/50" placeholder="Informe atividades, responsabilidades e requisitos que poderão ser reutilizados nas vagas." /><span className="mt-1 block text-[10px] text-slate-400">Este texto será sugerido automaticamente ao publicar uma vaga vinculada ao cargo.</span></div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Setores vinculados</label>
                        <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">{departmentsList.map(dept => <label key={dept.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${newRoleDepts.includes(dept.id) ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-transparent bg-white text-slate-600 hover:border-slate-200'}`}><input type="checkbox" checked={newRoleDepts.includes(dept.id)} onChange={event => setNewRoleDepts(previous => event.target.checked ? [...new Set([...previous, dept.id])] : previous.filter(id => id !== dept.id))} className="accent-blue-700" />{dept.name}</label>)}</div>
                        <span className="mt-1 block text-[10px] text-slate-400">Selecionados: {newRoleDepts.length}</span>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow mt-1"
                      >
                        <Plus className="h-4 w-4" /> Adicionar Cargo
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {mgmtSubTab === 'sectors' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-slate-800 text-base">Setores Cadastrados</h3>
                      <p className="text-slate-500 text-xs">Gerencie os setores ativos, altere as nomenclaturas e a cor institucional dos crachás.</p>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                      {departmentsList.map((dept) => {
                        const isEditing = editingSectorId === dept.id;
                        const connectedUsers = employeesList.filter(u => getUserDepts(u).includes(dept.id)).length;
                        const connectedRoles = rolesList.filter(r => getRoleDepts(r).includes(dept.id)).length;

                        return (
                          <div
                            key={dept.id}
                            className="p-3.5 rounded-xl border border-slate-150 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-all text-xs"
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-2.5 w-full">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editingSectorName}
                                    onChange={(e) => setEditingSectorName(e.target.value)}
                                    className="px-3 py-1.5 flex-1 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                                    autoFocus
                                  />
                                  <select
                                    value={editingSectorColor}
                                    onChange={(e) => setEditingSectorColor(e.target.value)}
                                    className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] focus:outline-none"
                                  >
                                    {SECTOR_COLORS.map((col) => (
                                      <option key={col.class} value={col.class}>{col.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSector(dept.id)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]"
                                  >
                                    Salvar Alterações
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSectorId(null)}
                                    className="text-slate-500 hover:text-slate-700 text-[10px] px-2 py-1.5"
                                  >
                                    Sair
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <strong className="text-slate-800 text-sm">{dept.name}</strong>
                                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${dept.color}`}>
                                      Amostra Crachá
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                                    <span>👤 {connectedUsers} Colaboradores</span>
                                    <span>👔 {connectedRoles} Cargos</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSectorId(dept.id);
                                      setEditingSectorName(dept.name);
                                      setEditingSectorColor(dept.color);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-all"
                                    title="Editar Nome/Cor do Setor"
                                  >
                                    <Edit2 className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSector(dept.id)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-all"
                                    title="Excluir Setor"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="font-black text-slate-850 text-sm">Criar Novo Setor</h4>
                      <p className="text-slate-500 text-xs">Crie novas categorias de departamentos para a sua empresa.</p>
                    </div>

                    <form onSubmit={handleAddSector} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Setor</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Recursos Humanos, Financeiro"
                          value={newSectorName}
                          onChange={(e) => setNewSectorName(e.target.value)}
                          className="px-3.5 py-2 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Visual do Crachá (Paleta)</label>
                        <select
                          value={newSectorColor}
                          onChange={(e) => setNewSectorColor(e.target.value)}
                          className="px-3 py-2.5 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                        >
                          {SECTOR_COLORS.map((col) => (
                            <option key={col.class} value={col.class}>{col.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Prévia do Crachá:</span>
                        <div className="flex justify-center">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded border ${newSectorColor}`}>
                            {newSectorName || 'Nome do Setor'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow mt-1"
                      >
                        <Plus className="h-4 w-4" /> Criar Setor Oficial
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>
      {/* BOTÃO FLUTUANTE DA IA */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isChatOpen && (
          <div className="bg-white rounded-2xl w-80 sm:w-96 h-[500px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-slate-900 text-slate-100 p-4 flex items-center justify-between border-b border-slate-850">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                  <Sparkles className="h-4.5 w-4.5 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">Assistente ComunicaAI</h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span> Base de Dados Comunica Integrada
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white self-end rounded-tr-none'
                      : 'bg-white text-slate-800 self-start rounded-tl-none border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap"><TextoComEmojis texto={msg.text} /></p>
                </div>
              ))}

              {isChatLoading && (
                <div className="bg-white text-slate-800 self-start rounded-2xl rounded-tl-none p-3 border border-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              )}
            </div>

            <div className="p-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white whitespace-nowrap">
              {[
                'Quem trabalha de home office hoje?',
                'Quando vai ser a festa junina?',
                'Tem cargos criados no marketing?',
                'Tem alguém ausente na semana?'
              ].map((question, qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => {
                    setChatInput(question);
                    triggerNotification('Sugestão de pergunta copiada!');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-slate-200"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-slate-150 bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder="Perguntar sobre escalas, ausências, cargos..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChatMessage();
                }}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-400/50"
              />
              <BotaoEmoji aoSelecionar={(emoji) => setChatInput(prev => prev + emoji)} />
              <button
                type="button"
                onClick={handleSendChatMessage}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-slate-900 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:bg-slate-800 transition-all border border-slate-850 hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-5.5 w-5.5 text-slate-300" />
          <span className="text-xs font-bold pr-1">ComunicaAI</span>
        </button>
      </div>

      {showControlCenter && (currentUser.isAdmin || currentUser.isDeveloper) && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-5">
          <div data-tour="control-center" role="dialog" aria-modal="true" aria-labelledby="control-center-title" className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 px-5 py-4 text-white sm:px-7">
              <div><span className="text-[9px] font-bold uppercase tracking-[.18em] text-cyan-200">Administração</span><h2 id="control-center-title" className="mt-1 text-lg font-black">Central de controle</h2><p className="mt-1 text-[11px] text-blue-100/75">Permissões por colaborador ou setor e histórico das alterações.</p></div>
              <button type="button" onClick={() => setShowControlCenter(false)} className="rounded-xl p-2 text-blue-100 hover:bg-white/10" aria-label="Fechar central de controle"><X className="h-5 w-5" /></button>
            </header>
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 sm:px-7">
              <button type="button" onClick={() => setControlCenterTab('permissions')} className={`border-b-2 px-4 py-3 text-xs font-extrabold ${controlCenterTab === 'permissions' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-500'}`}><Lock className="mr-1.5 inline h-4 w-4" />Permissões</button>
              <button type="button" onClick={() => setControlCenterTab('audit')} className={`border-b-2 px-4 py-3 text-xs font-extrabold ${controlCenterTab === 'audit' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-500'}`}><Database className="mr-1.5 inline h-4 w-4" />Auditoria</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-7">
              {controlCenterTab === 'permissions' ? <div data-tour="control-permissions" className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Quem receberá a regra?</h3><p className="mt-1 text-xs leading-5 text-slate-500">A configuração individual tem prioridade sobre a regra do setor.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => loadPermissionTarget('user', '')} className={`rounded-xl border p-3 text-xs font-bold ${permissionScope === 'user' ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-600'}`}>Colaborador</button><button type="button" onClick={() => loadPermissionTarget('sector', '')} className={`rounded-xl border p-3 text-xs font-bold ${permissionScope === 'sector' ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-600'}`}>Setor inteiro</button></div>
                  <label className="mt-4 block text-[10px] font-bold uppercase text-slate-500">Selecionar
                    <select value={permissionTargetId} onChange={event => loadPermissionTarget(permissionScope, event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700"><option value="">Escolha uma opção</option>{permissionScope === 'user' ? employeesList.slice().sort((a,b) => a.name.localeCompare(b.name, 'pt-BR')).map(user => <option key={user.id} value={user.id}>{user.name} — {user.role || 'Sem cargo'}</option>) : departmentsList.slice().sort((a,b) => a.name.localeCompare(b.name, 'pt-BR')).map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select>
                  </label>
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] leading-5 text-blue-900"><strong className="block">Como funciona</strong>Abas desmarcadas desaparecem do menu. “Alterar informações” transforma as áreas liberadas em somente leitura. Escalas, atividades, modelos e indicadores possuem controles específicos.</div>
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="text-sm font-extrabold text-slate-900">Áreas e ações permitidas</h3><p className="mt-1 text-xs text-slate-500">Selecione apenas o necessário para o trabalho dessa pessoa ou setor.</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">{ACCESS_MODULES.map(module => <label key={module.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-semibold ${permissionDraft.tabs?.[module.id] !== false ? 'border-blue-200 bg-blue-50 text-blue-950' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><span>{module.label}</span><input type="checkbox" checked={permissionDraft.tabs?.[module.id] !== false} onChange={event => setPermissionDraft(previous => ({ ...previous, tabs: { ...previous.tabs, [module.id]: event.target.checked } }))} className="accent-blue-700" /></label>)}</div>
                  <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2"><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canEdit ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><span>Alterar informações</span><input type="checkbox" checked={permissionDraft.canEdit !== false} onChange={event => setPermissionDraft(previous => ({ ...previous, canEdit: event.target.checked, ...(!event.target.checked ? { canManageActivities: false, canManageActivityTemplates: false } : {}) }))} className="accent-emerald-700" /></label><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canManageCalendar ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><span>Alterar escalas e calendário</span><input type="checkbox" checked={permissionDraft.canManageCalendar !== false} onChange={event => setPermissionDraft(previous => ({ ...previous, canManageCalendar: event.target.checked, ...(!event.target.checked ? { canManageScheduleRules: false } : {}) }))} className="accent-amber-700" /></label><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canManageScheduleRules !== false ? 'border-cyan-200 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-slate-50 text-slate-500'} ${permissionDraft.canManageCalendar === false ? 'cursor-not-allowed opacity-60' : ''}`}><span>Configurar regras da escala inteligente</span><input type="checkbox" disabled={permissionDraft.canManageCalendar === false} checked={permissionDraft.canManageScheduleRules !== false} onChange={event => setPermissionDraft(previous => ({ ...previous, canManageScheduleRules: event.target.checked }))} className="accent-cyan-700" /></label><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canManageActivities !== false ? 'border-violet-200 bg-violet-50 text-violet-900' : 'border-slate-200 bg-slate-50 text-slate-500'} ${permissionDraft.canEdit === false ? 'cursor-not-allowed opacity-60' : ''}`}><span>Criar e alterar atividades</span><input type="checkbox" disabled={permissionDraft.canEdit === false} checked={permissionDraft.canManageActivities !== false} onChange={event => setPermissionDraft(previous => ({ ...previous, canManageActivities: event.target.checked, ...(!event.target.checked ? { canManageActivityTemplates: false } : {}) }))} className="accent-violet-700" /></label><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canManageActivityTemplates ? 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900' : 'border-slate-200 bg-slate-50 text-slate-500'} ${permissionDraft.canManageActivities === false ? 'cursor-not-allowed opacity-60' : ''}`}><span>Administrar modelos de checklist</span><input type="checkbox" disabled={permissionDraft.canManageActivities === false} checked={permissionDraft.canManageActivityTemplates === true} onChange={event => setPermissionDraft(previous => ({ ...previous, canManageActivityTemplates: event.target.checked }))} className="accent-fuchsia-700" /></label><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canViewActivityInsights ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><span>Ver indicadores das atividades</span><input type="checkbox" checked={permissionDraft.canViewActivityInsights === true} onChange={event => setPermissionDraft(previous => ({ ...previous, canViewActivityInsights: event.target.checked }))} className="accent-indigo-700" /></label><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canPublishAbsenceForOthers ? 'border-sky-200 bg-sky-50 text-sky-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><span>Publicar ausência de outras pessoas</span><input type="checkbox" checked={permissionDraft.canPublishAbsenceForOthers === true} onChange={event => setPermissionDraft(previous => ({ ...previous, canPublishAbsenceForOthers: event.target.checked }))} className="accent-sky-700" /></label><label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-bold ${permissionDraft.canViewEngagement ? 'border-violet-200 bg-violet-50 text-violet-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><span>Ver confirmações e curtidas</span><input type="checkbox" checked={permissionDraft.canViewEngagement === true} onChange={event => setPermissionDraft(previous => ({ ...previous, canViewEngagement: event.target.checked }))} className="accent-violet-700" /></label></div>
                  <div className="mt-5 flex justify-end"><button type="button" onClick={savePermissionTarget} disabled={!permissionTargetId} className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Salvar permissões</button></div>
                </section>
              </div> : <section data-tour="control-audit" className="space-y-6">
                <div><span className="text-[9px] font-black uppercase tracking-[.18em] text-blue-700">Conversas e tickets</span><h3 className="mt-1 text-base font-extrabold text-slate-900">Desempenho da Caixa de Entrada</h3><p className="mt-1 text-xs leading-5 text-slate-500">Acompanhe volume, cumprimento de prazo, prorrogações e reaberturas.</p></div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
                  {[
                    { id: 'all', label: 'Conversas', value: conversationAuditMetrics.total, tone: 'border-blue-100 bg-blue-50 text-blue-800' },
                    { id: 'completed_on_time', label: 'No prazo', value: conversationAuditMetrics.onTime, tone: 'border-emerald-100 bg-emerald-50 text-emerald-800' },
                    { id: 'completed_late', label: 'Concluídas atrasadas', value: conversationAuditMetrics.late, tone: 'border-rose-100 bg-rose-50 text-rose-800' },
                    { id: 'overdue', label: 'Ainda vencidas', value: conversationAuditMetrics.overdue, tone: 'border-amber-100 bg-amber-50 text-amber-800' },
                    { id: 'extended', label: 'Prorrogadas', value: conversationAuditMetrics.extended, tone: 'border-violet-100 bg-violet-50 text-violet-800' },
                    { id: 'reopened', label: 'Reabertas', value: conversationAuditMetrics.reopened, tone: 'border-cyan-100 bg-cyan-50 text-cyan-800' },
                  ].map(metric => {
                    const active = conversationAuditStatus === metric.id;
                    return <button type="button" aria-pressed={active} onClick={() => setConversationAuditStatus(previous => previous === metric.id && metric.id !== 'all' ? 'all' : metric.id)} key={metric.id} className={`min-w-0 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${metric.tone} ${active ? 'ring-2 ring-current ring-offset-2' : ''}`}><strong className="block text-xl leading-none">{metric.value}</strong><span className="mt-1.5 block break-words text-[9px] font-black uppercase tracking-wide [overflow-wrap:anywhere]">{metric.label}</span></button>;
                  })}
                </div>
                <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">Período<select value={conversationAuditPeriod} onChange={event => setConversationAuditPeriod(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="180">Últimos 6 meses</option><option value="0">Todo o histórico</option></select></label>
                  <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">Situação<select value={conversationAuditStatus} onChange={event => setConversationAuditStatus(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"><option value="all">Todas</option><option value="open">Em andamento</option><option value="overdue">Ainda vencidas</option><option value="completed_on_time">Concluídas no prazo</option><option value="completed_late">Concluídas em atraso</option><option value="extended">Com prorrogação</option><option value="reopened">Reabertas</option></select></label>
                  <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">Colaborador<select value={conversationAuditPerson} onChange={event => setConversationAuditPerson(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"><option value="all">Todos</option>{messageContacts.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-4 py-3"><strong className="text-xs text-slate-900">Tickets encontrados</strong><span className="ml-2 text-[10px] text-slate-500">{conversationAuditFiltered.length} resultado(s)</span></div>
                  <div className="max-h-[34dvh] divide-y divide-slate-100 overflow-y-auto">{conversationAuditFiltered.map(row => <div key={row.id} className="grid min-w-0 gap-3 p-4 text-xs hover:bg-slate-50 md:grid-cols-[90px_1.3fr_1fr_auto] md:items-center"><div><span className="text-[9px] font-black uppercase text-slate-400">Ticket</span><strong className="block text-blue-800">#{row.ticket}</strong></div><div className="min-w-0"><strong className="block break-words text-slate-900 [overflow-wrap:anywhere]">{row.subject}</strong><span className="mt-1 block break-words text-[10px] text-slate-500 [overflow-wrap:anywhere]">Aberta por {row.openerName} · {row.participantNames.length} participante(s)</span></div><div><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${row.deadlineClassName}`}>{row.deadlineLabel}</span><span className="mt-1 block text-[10px] text-slate-500">Prazo: {formatDueDate(row.dueDate)}</span></div><div className="text-[10px] text-slate-500 md:text-right">{row.openedAt ? new Date(row.openedAt).toLocaleDateString('pt-BR') : 'Sem data'}{row.extensions > 0 && <span className="mt-1 block text-violet-600">{row.extensions} prorrogação(ões)</span>}{row.reopened && <span className="mt-1 block text-cyan-700">Reaberta</span>}</div></div>)}{conversationAuditFiltered.length === 0 && <div className="p-8 text-center text-xs text-slate-500">Nenhuma conversa encontrada com esses filtros.</div>}</div>
                </div>
                <div className="border-t border-slate-200 pt-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Histórico de alterações</h3>
                    <p className="mt-1 text-xs text-slate-500">Veja quem alterou, qual ação foi realizada, a área afetada, os campos e o horário.</p>
                  </div>
                  <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                    <div className="relative md:col-span-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={auditSearch} onChange={event => setAuditSearch(event.target.value)} placeholder="Buscar pessoa, área, ação ou campo alterado" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs" /></div>
                    <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">Pessoa<select value={auditPersonFilter} onChange={event => setAuditPersonFilter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case text-slate-700"><option value="all">Todas as pessoas</option>{auditActors.map(actor => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
                    <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">Área<select value={auditAreaFilter} onChange={event => setAuditAreaFilter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case text-slate-700"><option value="all">Todas as áreas</option>{auditAreas.map(area => <option key={area} value={area}>{auditCollectionLabels[area] || area}</option>)}</select></label>
                    <label className="text-[9px] font-black uppercase tracking-wide text-slate-500">Tipo de alteração<select value={auditActionFilter} onChange={event => setAuditActionFilter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold normal-case text-slate-700"><option value="all">Todas as ações</option>{auditActions.map(action => <option key={action} value={action}>{auditActionLabels[action] || action}</option>)}</select></label>
                    <div className="flex items-end"><button type="button" onClick={() => { setAuditSearch(''); setAuditPersonFilter('all'); setAuditAreaFilter('all'); setAuditActionFilter('all'); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300">Limpar filtros</button></div>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="max-h-[38dvh] divide-y divide-slate-100 overflow-y-auto">
                    {filteredAuditLogs.map(entry => <div key={entry.id} className="grid min-w-0 gap-2 p-4 text-xs hover:bg-slate-50 sm:grid-cols-[1fr_1fr_auto]">
                      <div className="min-w-0"><strong className="block break-words text-slate-900 [overflow-wrap:anywhere]">{entry.actorName || 'Usuário'}</strong><span className="break-words text-[10px] text-slate-500 [overflow-wrap:anywhere]">{entry.actorRole || 'Colaborador'} · {auditActionLabels[entry.action] || entry.action || 'realizou uma alteração'}</span></div>
                      <div className="min-w-0"><strong className="block break-words text-slate-700 [overflow-wrap:anywhere]">{auditCollectionLabels[entry.collection] || entry.collection || 'Sistema'}</strong><span className="break-words text-[10px] leading-5 text-slate-500 [overflow-wrap:anywhere]">{(entry.fields || []).length ? `Alterou: ${(entry.fields || []).filter(field => !['pin', 'password', 'pushTokens'].includes(field)).map(field => auditFieldLabels[field] || field).join(', ')}` : `Registro: ${entry.documentId || '—'}`}</span></div>
                      <time className="text-[10px] font-semibold text-slate-500 sm:whitespace-nowrap">{entry.timestamp ? new Date(entry.timestamp).toLocaleString('pt-BR') : 'Data indisponível'}</time>
                    </div>)}
                    {filteredAuditLogs.length === 0 && <div className="p-10 text-center text-xs text-slate-500">Nenhuma alteração encontrada para os filtros selecionados.</div>}
                  </div>
                </div>
              </section>}
            </div>
          </div>
        </div>
      )}

      {engagementDetail && canViewEngagement && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-label="Detalhes de participação">
          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
              <div className="min-w-0"><span className="text-[9px] font-black uppercase tracking-widest text-blue-700">Participação</span><h3 className="mt-1 break-words text-sm font-extrabold text-slate-900">{engagementDetail.title}</h3></div>
              <button type="button" onClick={() => setEngagementDetail(null)} aria-label="Fechar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center justify-between gap-2"><strong className="text-xs text-emerald-900">Confirmaram leitura</strong><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-emerald-700">{engagementDetail.readIds.length}</span></div><div className="mt-3 space-y-2">{engagementDetail.readIds.map(userId => <div key={userId} className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{engagementUserName(userId)}</div>)}{engagementDetail.readIds.length === 0 && <p className="text-[10px] text-emerald-800/70">Nenhuma confirmação registrada.</p>}</div></section>
              <section className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><div className="flex items-center justify-between gap-2"><strong className="text-xs text-rose-900">Curtiram</strong><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-rose-700">{engagementDetail.likedIds.length}</span></div><div className="mt-3 space-y-2">{engagementDetail.likedIds.map(userId => <div key={userId} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{engagementUserName(userId)}</div>)}{engagementDetail.likedIds.length === 0 && <p className="text-[10px] text-rose-800/70">Nenhuma curtida registrada.</p>}</div></section>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MEU PERFIL DE COLABORADOR */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/65 flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <User className="h-5 w-5 text-slate-300" /> Atualizar Meu Perfil
              </h3>
              <button type="button" onClick={() => setShowProfileModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMyProfileSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-slate-200 shadow-md">
                  <img src={myProfileForm.avatar || DEFAULT_AVATAR} className="w-full h-full object-cover" alt="Foto Perfil" />
                  {currentUser.isAdmin && myProfileForm.avatar && (
                    <button
                      type="button"
                      onClick={() => setMyProfileForm(prev => ({ ...prev, avatar: '' }))}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="w-full">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 text-center">FOTO DO DISPOSITIVO (UPLOAD)</label>
                  {currentUser.isAdmin ? (
                    <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100 max-w-xs mx-auto">
                      <ImageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">Carregar Foto Local...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setMyProfileForm, 'avatar')}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <p className="max-w-xs mx-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-[10px] font-medium text-slate-500">
                      A foto do perfil só pode ser alterada por um administrador.
                    </p>
                  )}
                </div>
              </div>

              {/* CAMPOS SEPARADOS DE CONTATO DE EMERGÊNCIA */}
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">CONTATO DE EMERGÊNCIA</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nome</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria de Souza"
                      value={myProfileForm.emergencyName}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, emergencyName: e.target.value })}
                      className="px-3 py-2 w-full rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-550/50 bg-slate-50 font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Parentesco</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Esposa, Mãe, Filho"
                      value={myProfileForm.emergencyRelationship}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, emergencyRelationship: e.target.value })}
                      className="px-3 py-2 w-full rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-550/50 bg-slate-50 font-medium text-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Contato / Telefone</label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: (71) 98888-8888"
                      value={myProfileForm.emergencyPhone}
                      onChange={(e) => setMyProfileForm({ ...myProfileForm, emergencyPhone: e.target.value })}
                      className="pl-9 pr-3 py-2 w-full rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-550/50 bg-slate-50 font-medium text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPinFieldsInProfile(!showPinFieldsInProfile)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-700 hover:text-slate-900 transition-all focus:outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-slate-500" /> Alterar PIN de Segurança (Senha)
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md">
                    {showPinFieldsInProfile ? 'Recolher [-]' : 'Alterar Senha [+]'}
                  </span>
                </button>

                {showPinFieldsInProfile && (
                  <div className="mt-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/65 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">PIN de Acesso Atual</label>
                      <input
                        type="password"
                        maxLength="4"
                        placeholder="• • • •"
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                        className="px-3 py-2 text-center tracking-widest text-sm font-black w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-550 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Novo PIN (4 dígitos)</label>
                        <input
                          type="password"
                          maxLength="4"
                          placeholder="• • • •"
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                          className="px-3 py-2 text-center tracking-widest text-sm font-black w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-550 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Confirmar Novo PIN</label>
                        <input
                          type="password"
                          maxLength="4"
                          placeholder="• • • •"
                          value={confirmNewPinInput}
                          onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                          className="px-3 py-2 text-center tracking-widest text-sm font-black w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-550 bg-white"
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 block text-center">Para alterar o seu PIN, informe a senha atual e defina um novo PIN numérico de 4 dígitos.</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button type="button" disabled={isChangingPin} onClick={() => setShowProfileModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">
                  Cancelar
                </button>
                <button type="submit" disabled={isChangingPin} className="inline-flex min-w-[112px] items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:cursor-wait disabled:opacity-60">
                  {isChangingPin && <LoaderCircle className="h-4 w-4 animate-spin" />}{isChangingPin ? 'Alterando PIN...' : 'Salvar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESUMO DA INTELIGENCIA ARTIFICIAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-slate-950/65 flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Sparkles className="h-5 w-5 text-slate-300" /> Boletim Informativo Semanal Inteligente
              </h3>
              <button type="button" onClick={() => setShowSummaryModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[480px] overflow-y-auto">
              {isSummaryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 font-bold">A inteligência artificial está consolidando todos os dados da semana...</p>
                </div>
              ) : (
                <div className="prose text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {summaryContent}
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-150 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 text-slate-500 text-xs font-bold"
              >
                Fechar Painel
              </button>

              {!isSummaryLoading && (
                <button
                  type="button"
                  onClick={() => {
                    const text = summaryContent;

                    const fallbackCopy = () => {
                      try {
                        const textArea = document.createElement("textarea");
                        textArea.value = text;
                        textArea.style.position = "fixed";
                        textArea.style.opacity = "0";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);

                        if (successful) {
                          triggerNotification('Texto copiado com sucesso! Pronto para colar no e-mail corporativo.');
                        } else {
                          triggerNotification('Cópia automática bloqueada. Selecione o texto acima e copie manualmente (Ctrl+C).', 'error');
                        }
                      } catch (err) {
                        triggerNotification('Permissão negada pelo navegador. Selecione o texto e copie manualmente.', 'error');
                      }
                    };

                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(text)
                        .then(() => triggerNotification('Texto copiado com sucesso! Pronto para colar no e-mail corporativo.'))
                        .catch(() => fallbackCopy());
                    } else {
                      fallbackCopy();
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Copiar Boletim Formatado
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR PIN DE SEGURANÇA */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-[1200] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <KeyRound className="h-5 w-5 text-slate-300" /> Alterar PIN de Segurança
              </h3>
              {!forcePinChange && <button type="button" onClick={() => setShowChangePinModal(false)} className="p-1 hover:bg-slate-800 rounded"><X className="h-5 w-5" /></button>}
            </div>

            <form onSubmit={handleChangePinSubmit} className="p-6 flex flex-col gap-4">
              {forcePinChange && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900"><strong className="block">Primeiro acesso</strong>Crie um PIN pessoal antes de continuar. O PIN provisório não poderá mais ser utilizado depois da alteração.</div>}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">PIN de Acesso Atual</label>
                <input
                  type="password"
                  maxLength="4"
                  required
                  placeholder="• • • •"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  className="px-3.5 py-2.5 text-center tracking-widest text-lg font-black w-full rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-550/50 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Novo PIN de Acesso (4 Dígitos)</label>
                <input
                  type="password"
                  maxLength="4"
                  required
                  placeholder="• • • •"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="px-3.5 py-2.5 text-center tracking-widest text-lg font-black w-full rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-550/50 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Confirmar Novo PIN</label>
                <input
                  type="password"
                  maxLength="4"
                  required
                  placeholder="• • • •"
                  value={confirmNewPinInput}
                  onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="px-3.5 py-2.5 text-center tracking-widest text-lg font-black w-full rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-550/50 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                {!forcePinChange && <button type="button" disabled={isChangingPin} onClick={() => setShowChangePinModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">Cancelar</button>}
                <button type="submit" disabled={isChangingPin} className="inline-flex min-w-[150px] items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:cursor-wait disabled:opacity-60">
                  {isChangingPin && <LoaderCircle className="h-4 w-4 animate-spin" />}{isChangingPin ? 'Atualizando...' : 'Atualizar Senha PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRO DE PRODUTIVIDADE */}
{showProdModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Activity className="h-5 w-5 text-slate-300" /> {editingProdId ? 'Editar Produção' : 'Registrar Produção'}
              </h3>
              <button type="button" onClick={() => { setShowProdModal(false); setEditingProdId(null); }} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitProductivity} className="p-6 flex flex-col gap-4">

              {/* BLOCO 1: GRUPO E DATA LADO A LADO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grupo</label>
                  <select
                    required
                    value={newProdLog.group}
                    onChange={(e) => setNewProdLog({ ...newProdLog, group: e.target.value })}
                    disabled={!canManageAllProductivity}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="Máquina 1">Máquina 1</option>
                    <option value="Máquina 2">Máquina 2</option>
                    <option value="Laje">Laje</option>
                    <option value="Mourão">Mourão</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newProdLog.date}
                    onChange={(e) => setNewProdLog({ ...newProdLog, date: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-slate-50 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* BLOCO 2: QUANTIDADES LADO A LADO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qtd (Boa)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 500"
                    value={newProdLog.quantity}
                    onChange={(e) => setNewProdLog({ ...newProdLog, quantity: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-sm font-black focus:outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 text-rose-600">Qtd Defeito</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 5"
                    value={newProdLog.defects}
                    onChange={(e) => setNewProdLog({ ...newProdLog, defects: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-rose-200 text-sm font-black focus:outline-none text-rose-700 bg-rose-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrição do produto</label>
                <input
                  type="text"
                  placeholder="Ex.: Bloco 14x19x39, laje treliçada..."
                  value={newProdLog.productDescription || ''}
                  onChange={(e) => setNewProdLog({ ...newProdLog, productDescription: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Foto / Comprovante</label>
                <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  <ImageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span>Anexar Foto...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setNewProdLog)}
                    className="hidden"
                  />
                </label>
                {newProdLog.image && (
                  <div className="mt-2 relative w-full h-16 rounded-xl overflow-hidden border border-slate-200">
                    <img src={newProdLog.image} className="w-full h-full object-cover" alt="Prévia" />
                    <button type="button" onClick={() => setNewProdLog(prev => ({ ...prev, image: '' }))} className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Observações (Opcional)</label>
                <textarea
                  rows="2"
                  placeholder="Alguma falha na máquina? Falta de insumo?"
                  value={newProdLog.notes}
                  onChange={(e) => setNewProdLog({ ...newProdLog, notes: e.target.value })}
                  className="px-3.5 py-2 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                ></textarea>
                <BotaoEmoji aoSelecionar={(emoji) => setNewProdLog(prev => ({ ...prev, notes: prev.notes + emoji }))} />
                <PreviaEmojis texto={newProdLog.notes} />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => { setShowProdModal(false); setEditingProdId(null); }} className="px-4 py-2 text-slate-500 text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                  {editingProdId ? 'Atualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRO DE PRESENÇA DIÁRIA */}
      {showPresenceModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <UserCheck className="h-5 w-5 text-slate-300" /> Registrar Escala de Trabalho Diária
              </h3>
              <button type="button" onClick={() => setShowPresenceModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitPresence} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Colaborador</label>
                {currentUser.isAdmin || currentUser.isDeveloper || isManager || effectiveAccessProfile.canPublishAbsenceForOthers === true ? (
                  <select
                    value={newPresence.name}
                    onChange={(e) => {
                      const selectedUser = usersList.find(u => u.name === e.target.value);
                      const existingPres = presenceList.find(p => p.name === e.target.value);
                      const primaryDept = selectedUser && selectedUser.depts && selectedUser.depts.length > 0
                        ? selectedUser.depts[0]
                        : (selectedUser?.dept || 'rh');

                      setNewPresence({
                        name: e.target.value,
                        dept: primaryDept,
                        status: existingPres ? existingPres.status : 'Presencial',
                        notes: existingPres ? existingPres.notes : '',
                        startDate: todayStr,
                        endDate: todayStr
                      });
                    }}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    {employeesList.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    readOnly
                    value={newPresence.name}
                    className="px-3.5 py-2.5 w-full bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs focus:outline-none cursor-not-allowed"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Setor</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={departmentsList.find(d => d.id === newPresence.dept)?.name || newPresence.dept}
                    className="px-3.5 py-2.5 w-full bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status de Trabalho</label>
                  <select
                    value={newPresence.status}
                    onChange={(e) => setNewPresence({ ...newPresence, status: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    {currentUser.isAdmin || currentUser.isDeveloper || isManager ? <>
                      <option value="Presencial">Presencial (Sede)</option>
                      <option value="Home Office">Home Office (Remoto)</option>
                      <option value="Folga">Folga Escalonada</option>
                    </> : null}
                    <option value="Férias">Licença / Férias</option>
                  </select>
                </div>
              </div>

              {newPresence.status === 'Férias' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in-95">
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                      <Calendar className="h-4 w-4" /> Registrar no Calendário Geral
                    </span>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Data Início</label>
                    <input
                      type="date"
                      required={newPresence.status === 'Férias'}
                      value={newPresence.startDate}
                      onChange={(e) => setNewPresence({ ...newPresence, startDate: e.target.value })}
                      className="px-3 py-2 w-full rounded-lg border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Último dia de férias</label>
                    <input
                      type="date"
                      required={newPresence.status === 'Férias'}
                      value={newPresence.endDate}
                      onChange={(e) => setNewPresence({ ...newPresence, endDate: e.target.value })}
                      className="px-3 py-2 w-full rounded-lg border border-slate-200 text-xs focus:outline-none"
                    />
                    <span className="mt-1 block text-[9px] text-slate-400">O retorno ao trabalho será no dia seguinte.</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notas de Localização / Escala</label>
                <input
                  type="text"
                  placeholder="Ex: Sala de suporte técnico, Reunião externa às 15h..."
                  value={newPresence.notes}
                  onChange={(e) => setNewPresence({ ...newPresence, notes: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowPresenceModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                  Confirmar Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {publishedScheduleEdit && publishedScheduleEdit.companyId === activeCompany?.id && <PublishedScheduleEditor key={`${publishedScheduleEdit.source.id}|${publishedScheduleEdit.date}`} edit={publishedScheduleEdit} context={{ history: publishedScheduleEdit.history, absences: publishedScheduleEdit.absences, rules: publishedScheduleEdit.rules, employees: scheduleScope.employees, getDepartments: getUserDepts }} requirements={scheduleScopedCoverageRequirements} departments={scheduleScope.departments} ready={schedulePlanningDataReady()} stale={scheduleSignature(workSchedules) !== scheduleSignature(publishedScheduleEdit.history) || JSON.stringify(absences) !== JSON.stringify(publishedScheduleEdit.absences) || JSON.stringify(automaticScheduleRules) !== JSON.stringify(publishedScheduleEdit.rules)} disabled={isSavingPublishedSchedule} onSave={savePublishedScheduleEdit} onClose={() => { if (!isSavingPublishedSchedule) setPublishedScheduleEdit(null); }} />}
      {publishedScheduleSwap && publishedScheduleSwap.companyId === activeCompany?.id && <PublishedScheduleSwap key={`${publishedScheduleSwap.source.id}|${publishedScheduleSwap.date}`} mode={publishedScheduleSwap.requestId ? 'approval' : 'apply'} swap={publishedScheduleSwap} context={{ history: publishedScheduleSwap.history, absences: publishedScheduleSwap.absences, rules: publishedScheduleSwap.rules, employees: scheduleScope.employees, getDepartments: getUserDepts }} requirements={scheduleScopedCoverageRequirements} departments={scheduleScope.departments} employees={scheduleScope.employees} ready={schedulePlanningDataReady()} stale={scheduleSignature(workSchedules) !== scheduleSignature(publishedScheduleSwap.history) || JSON.stringify(absences) !== JSON.stringify(publishedScheduleSwap.absences) || JSON.stringify(automaticScheduleRules) !== JSON.stringify(publishedScheduleSwap.rules)} disabled={isSavingPublishedSchedule} onSave={savePublishedScheduleSwap} onClose={() => { if (!isSavingPublishedSchedule) setPublishedScheduleSwap(null); }} />}
      {publishedScheduleSwapRequest && publishedScheduleSwapRequest.companyId === activeCompany?.id && <PublishedScheduleSwap key={`${publishedScheduleSwapRequest.source.id}|${publishedScheduleSwapRequest.date}|request`} mode="request" swap={publishedScheduleSwapRequest} context={{ history: publishedScheduleSwapRequest.history, absences: publishedScheduleSwapRequest.absences, rules: publishedScheduleSwapRequest.rules, employees: scheduleScope.employees, getDepartments: getUserDepts }} requirements={scheduleScopedCoverageRequirements} departments={scheduleScope.departments} employees={scheduleScope.employees} ready={schedulePlanningDataReady()} stale={scheduleSignature(workSchedules) !== scheduleSignature(publishedScheduleSwapRequest.history) || JSON.stringify(absences) !== JSON.stringify(publishedScheduleSwapRequest.absences) || JSON.stringify(automaticScheduleRules) !== JSON.stringify(publishedScheduleSwapRequest.rules)} disabled={isSavingScheduleSwapRequest} onSave={submitPublishedScheduleSwapRequest} onClose={() => { if (!isSavingScheduleSwapRequest) setPublishedScheduleSwapRequest(null); }} />}
      {showBulkScheduleModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
              <div><h3 className="flex items-center gap-2 text-sm font-extrabold"><Calendar className="h-5 w-5 text-violet-200" /> Escala em lote</h3><p className="mt-0.5 text-[10px] text-slate-300">Planeje folgas, presencial ou home office diretamente no calendário.</p></div>
              <button type="button" disabled={isSavingScheduleProposal} onClick={() => setShowBulkScheduleModal(false)} className="rounded p-1 hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={event => { if (bulkScheduleMode === 'manual') return saveBulkSchedule(event); event.preventDefault(); generateAutomaticSchedule(); }} className="space-y-4 p-5 sm:p-6"><fieldset disabled={isSavingScheduleProposal} className="contents">
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5"><button type="button" onClick={() => setBulkScheduleMode('smart')} className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${bulkScheduleMode === 'smart' ? 'bg-white text-cyan-900 shadow-sm' : 'text-slate-500'}`}><Sparkles className="mr-1.5 inline h-4 w-4" />Escala inteligente</button><button type="button" onClick={() => { setBulkScheduleMode('manual'); setAutomaticScheduleProposal([]); }} className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${bulkScheduleMode === 'manual' ? 'bg-white text-violet-900 shadow-sm' : 'text-slate-500'}`}><Edit2 className="mr-1.5 inline h-4 w-4" />Marcação simples</button></div>
              {bulkScheduleMode === 'smart' && <>
               {isFirebaseAvailable && dbUser && activeCompany?.id && <ScheduleDraftBar key={`${activeCompany.id}|${dbUser.uid}`} api={{ db, collection, doc, getDoc, getDocs, runTransaction }} appId={appId} companyId={activeCompany.id} ownerId={dbUser.uid} draftOwners={scheduleScope.employees.map(user => ({ id: String(user.id), name: user.name }))} canViewTeamDrafts={Boolean(currentUser.isAdmin || currentUser.isDeveloper)} snapshot={{ bulk: bulkSchedule, rows: automaticScheduleProposal, holidayAssignments: automaticScheduleHolidayAssignments, weeklyHours: automaticScheduleWeeklyHoursText, selectedDate: automaticSchedulePreviewDate, proposalInput: automaticScheduleProposalInput }} departmentIds={[...new Set([...automaticScheduleProposal.map(row => row.dept), ...scheduleScope.employees.filter(user => bulkSchedule.userIds.some(id => String(id) === String(user.id))).map(user => scheduleDepartmentForEmployee(user, scheduleScope, getUserDepts))].filter(Boolean))]} onRestore={restoreAutomaticScheduleDraft} disabled={isSavingScheduleProposal || !schedulePlanningDataReady() || (!currentUser.isAdmin && !currentUser.isDeveloper && (effectiveAccessProfile.canEdit === false || effectiveAccessProfile.canManageCalendar === false))} />}
              <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-violet-50">
                <div className="flex flex-col gap-3 border-b border-cyan-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-cyan-900"><Sparkles className="h-3.5 w-3.5" /> Planejamento inteligente</span><h4 className="mt-2 text-sm font-extrabold text-slate-900">Monte uma escala baseada em regras reais</h4><p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-600">Defina a política uma vez, reutilize o padrão de cada colaborador e revise o quadro antes de publicar.</p></div>
                  <div className={`grid w-full gap-1 rounded-xl border border-cyan-100 bg-white/80 p-1 sm:w-auto ${canConfigureScheduleRules ? 'grid-cols-3 sm:min-w-[390px]' : 'grid-cols-1 sm:min-w-[180px]'}`}>{canConfigureScheduleRules && <><button type="button" onClick={() => setAutomaticScheduleRuleTab('rules')} className={`rounded-lg px-2 py-2 text-[9px] font-extrabold sm:px-3 sm:text-[10px] ${automaticScheduleRuleTab === 'rules' ? 'bg-cyan-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Settings2 className="mr-1 inline h-3.5 w-3.5" />Turnos e turmas</button><button type="button" onClick={() => setAutomaticScheduleRuleTab('team')} className={`rounded-lg px-2 py-2 text-[9px] font-extrabold sm:px-3 sm:text-[10px] ${automaticScheduleRuleTab === 'team' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Users className="mr-1 inline h-3.5 w-3.5" />Necessidade da operação</button></>}<button type="button" onClick={() => setAutomaticScheduleRuleTab('planning')} className={`rounded-lg px-2 py-2 text-[9px] font-extrabold sm:px-3 sm:text-[10px] ${automaticScheduleRuleTab === 'planning' ? 'bg-violet-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Calendar className="mr-1 inline h-3.5 w-3.5" />Gerar e revisar</button></div>
                </div>
                {automaticScheduleRuleTab === 'rules' && canConfigureScheduleRules ? <div className="space-y-4 p-4">
                  <ScheduleConfigurationAudit audit={automaticScheduleConfigurationAudit} onApplySuggestion={() => { const suggested = suggestCompatibleScheduleRules({ ...automaticScheduleRules, hoursPerWeek: scheduleTextToHours(automaticScheduleWeeklyHoursText) || automaticScheduleRules.hoursPerWeek }); setAutomaticScheduleRules(suggested); setAutomaticScheduleWeeklyHoursText(scheduleDurationToText(suggested.hoursPerWeek)); setAutomaticScheduleProposal([]); triggerNotification('A base foi ajustada para compatibilizar carga, jornada, descanso e dias disponíveis. Revise e salve a nova versão.'); }} />
                  <ScheduleShiftEditor shifts={automaticScheduleRules.shifts || []} groups={automaticScheduleRules.ruleGroups || []} onChange={shifts => { setAutomaticScheduleRules(previous => ({ ...previous, shifts })); setAutomaticScheduleProposal([]); }} />
                  <ScheduleRuleEditor baseRules={automaticScheduleRules} key={automaticScheduleEditorFocus?.ruleId || 'editor'} initialGroupId={automaticScheduleEditorFocus?.groupId} initialRuleId={automaticScheduleEditorFocus?.ruleId} shifts={automaticScheduleRules.shifts || []} groups={automaticScheduleRules.ruleGroups || []} employees={scheduleScope.employees} departments={scheduleScope.departments} onChange={ruleGroups => { setAutomaticScheduleRules(previous => ({ ...previous, ruleGroups })); setAutomaticScheduleProposal([]); }} />
                  <details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-bold text-slate-700">Exceções e vínculo individual</summary><div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3"><h5 className="text-xs font-bold text-cyan-950">Conjunto de cada colaborador</h5><p className="mt-1 text-[11px] text-cyan-800">Escolha o conjunto que define os dias, folgas e jornadas especiais de cada pessoa.</p><div className="mt-3 grid max-h-64 gap-3 overflow-auto sm:grid-cols-2">{scheduleScope.employees.map(user => <label key={user.id} className="text-xs font-bold text-slate-700">{user.name}<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" value={(automaticScheduleRules.ruleGroups || []).find(group => group.userIds.includes(String(user.id)))?.id || ''} onChange={event => { const targetGroup = event.target.value; setAutomaticScheduleRules(previous => ({ ...previous, ruleGroups: (previous.ruleGroups || []).map(group => ({ ...group, userIds: group.id === targetGroup ? [...new Set([...group.userIds, String(user.id)])] : group.userIds.filter(id => id !== String(user.id)) })) })); setAutomaticScheduleProposal([]); }}><option value="">Padrão da empresa</option>{(automaticScheduleRules.ruleGroups || []).map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>)}</div></div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><strong className="text-[11px] text-emerald-950">Ajustes individuais da jornada base</strong><p className="mt-1 text-[9px] leading-4 text-emerald-800">Estes horários ajustam a jornada base da pessoa. Para folgas, revezamentos ou mudanças em qualquer dia, use as regras individuais dentro do conjunto.</p></div>
                  <div className="max-h-[390px] overflow-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[720px] text-left text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr><th className="px-3 py-2.5">Colaborador</th><th className="px-2 py-2.5">Entrada própria</th><th className="px-2 py-2.5">Saída nos dias comuns</th><th className="px-2 py-2.5">Saída no sábado</th><th className="px-3 py-2.5 text-right">Ação</th></tr></thead><tbody>{bulkScheduleVisibleEmployees.filter(user => bulkSchedule.userIds.some(id => String(id) === String(user.id))).map(user => { const override = automaticScheduleRules.employeeOverrides?.[user.id] || {}; const updateOverride = changes => setAutomaticScheduleRules(previous => ({ ...previous, employeeOverrides: { ...(previous.employeeOverrides || {}), [user.id]: { ...(previous.employeeOverrides?.[user.id] || {}), ...changes } } })); return <tr key={user.id} className="border-t border-slate-100"><td className="px-3 py-2.5"><strong className="block text-slate-800">{user.name}</strong><span className="text-[8px] text-slate-400">{scheduleScope.departments.find(dept => dept.id === getUserDepts(user)[0])?.name || user.role}</span></td><td className="px-2 py-2"><input type="time" value={override.shiftStart || ''} onChange={event => updateOverride({ shiftStart: event.target.value })} className="w-[110px] rounded-lg border border-slate-200 px-2 py-2" /><span className="ml-2 text-[8px] text-slate-400">padrão {automaticScheduleRules.shiftStart}</span></td><td className="px-2 py-2"><input type="time" value={override.shiftEnd || ''} onChange={event => updateOverride({ shiftEnd: event.target.value })} className="w-[110px] rounded-lg border border-slate-200 px-2 py-2" /><span className="ml-2 text-[8px] text-slate-400">padrão {automaticScheduleRules.shiftEnd}</span></td><td className="px-2 py-2"><input type="time" value={override.saturdayEnd || ''} onChange={event => updateOverride({ saturdayEnd: event.target.value })} className="w-[110px] rounded-lg border border-slate-200 px-2 py-2" /><span className="ml-2 text-[8px] text-slate-400">vazio = saída comum</span></td><td className="px-3 py-2 text-right"><button type="button" onClick={() => setAutomaticScheduleRules(previous => { const employeeOverrides = { ...(previous.employeeOverrides || {}) }; delete employeeOverrides[user.id]; return { ...previous, employeeOverrides }; })} className="rounded-lg border border-slate-200 px-2.5 py-2 font-bold text-slate-500 hover:bg-slate-50">Usar padrão</button></td></tr>; })}</tbody></table></div>
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[9px] leading-4 text-slate-500">As exceções ficam vinculadas ao colaborador e serão reutilizadas nas próximas escalas.</p><button type="button" disabled={isSavingScheduleRules} onClick={saveAutomaticScheduleRules} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{isSavingScheduleRules ? 'Salvando...' : 'Salvar exceções'}</button></div>
                  </div></details>
                  <details className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-bold text-slate-800">Base da empresa e opções avançadas</summary>
                  <p className="text-xs leading-5 text-slate-600">Esta base preenche apenas os campos não definidos na turma ou na pessoa. Configure o trabalho habitual em “Turmas e regras”. Limites são conferências de segurança e podem bloquear uma jornada incompatível.</p>
                  <h5 className="text-xs font-extrabold text-slate-800">Jornada para quem herda a base da empresa</h5>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-[9px] font-bold uppercase text-slate-600 sm:col-span-2">Nome desta política<input maxLength="80" value={automaticScheduleRules.name} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" placeholder="Ex.: Escala padrão da loja" /></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Dias de trabalho por semana<input type="number" min="1" max="7" value={automaticScheduleRules.workDaysPerWeek} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, workDaysPerWeek: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Descanso a cada quantos dias<input type="number" min="2" max="14" value={automaticScheduleRules.restEveryDays} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, restEveryDays: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Carga semanal (hh:mm)<input type="text" inputMode="numeric" maxLength="6" value={automaticScheduleWeeklyHoursText} onChange={event => setAutomaticScheduleWeeklyHoursText(event.target.value.replace(/[^0-9:]/g, ''))} onBlur={() => { const hours = scheduleTextToHours(automaticScheduleWeeklyHoursText); if (/^\d{1,3}:[0-5]\d$/.test(automaticScheduleWeeklyHoursText) && hours >= 1 && hours <= 84) setAutomaticScheduleRules(previous => ({ ...previous, hoursPerWeek: hours })); }} placeholder="40:00" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /><span className="mt-1 block normal-case font-medium text-slate-400">Use sempre horas e minutos, por exemplo 44:00.</span></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Entrada padrão<input type="time" value={automaticScheduleRules.shiftStart} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, shiftStart: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Saída padrão<input type="time" value={automaticScheduleRules.shiftEnd} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, shiftEnd: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /><span className="mt-1 block normal-case font-medium text-slate-400">Horário de fechamento; use exceções quando necessário.</span></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Início do intervalo<input type="time" value={automaticScheduleRules.breakStart} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, breakStart: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Fim do intervalo<input type="time" value={automaticScheduleRules.breakEnd} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, breakEnd: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /></label>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">Limites de validação · não alteram o turno</h5>
                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5">
                    <label className="text-[9px] font-bold uppercase text-slate-600">Descanso entre jornadas (h)<input type="number" min="0" max="24" step="0.5" value={automaticScheduleRules.minRestHours} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, minRestHours: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Máximo diário (h)<input type="number" min="1" max="24" step="0.5" value={automaticScheduleRules.maxDailyHours} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, maxDailyHours: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Máximo semanal (h)<input type="number" min="1" max="84" step="0.5" value={automaticScheduleRules.maxWeeklyHours} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, maxWeeklyHours: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Máximo extra por dia (h)<input type="number" min="0" max="12" step="0.5" value={automaticScheduleRules.maxExtraHoursPerDay} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, maxExtraHoursPerDay: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/></label>
                    <label className="text-[9px] font-bold uppercase text-slate-600">Quando exceder<select value={automaticScheduleRules.limitSeverity} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, limitSeverity: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="blocking">Bloquear publicação</option><option value="warning">Exibir aviso</option></select></label>
                    <p className="text-[9px] leading-4 text-amber-900 sm:col-span-2 lg:col-span-5">Parâmetros operacionais configuráveis. Confira a política da empresa e a orientação profissional aplicável antes de usá-los como bloqueios.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-3"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-[10px] text-slate-800">Dias padrão para turmas sem dias próprios</strong><p className="text-[9px] leading-4 text-slate-500">As folgas serão distribuídas entre os dias liberados, em rodízio por colaborador.</p></div><span className="text-[9px] font-bold text-slate-500">{automaticScheduleRules.allowedWeekdays.length} dia(s) liberado(s)</span></div><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">{SCHEDULE_WEEKDAYS.map(day => { const active = automaticScheduleRules.allowedWeekdays.includes(day.value); return <button type="button" key={day.value} onClick={() => setAutomaticScheduleRules(previous => ({ ...previous, allowedWeekdays: active ? previous.allowedWeekdays.filter(value => value !== day.value) : [...previous.allowedWeekdays, day.value].sort() }))} className={`rounded-lg border px-2 py-2 text-[10px] font-black ${active ? 'border-cyan-300 bg-cyan-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>{day.label}</button>; })}</div></div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${automaticScheduleRules.holidaysCountAsRest ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}><input type="checkbox" checked={automaticScheduleRules.holidaysCountAsRest} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, holidaysCountAsRest: event.target.checked }))} className="mt-0.5 accent-amber-700" /><span><strong className="block text-[10px] text-slate-800">Feriado conta como descanso</strong><small className="mt-0.5 block text-[9px] leading-4 text-slate-500">Ativo: feriado é folga por padrão. Desativado: segue a escala normal. Na geração, você pode escolher individualmente quem trabalha em cada feriado.</small></span></label>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${automaticScheduleRules.reuseLastSchedule ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}><input type="checkbox" checked={automaticScheduleRules.reuseLastSchedule} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, reuseLastSchedule: event.target.checked }))} className="mt-0.5 accent-emerald-700" /><span><strong className="block text-[10px] text-slate-800">Reutilizar o último padrão individual</strong><small className="mt-0.5 block text-[9px] leading-4 text-slate-500">Mantém entrada, saída e intervalo usados anteriormente por cada colaborador. Horas extras não são copiadas.</small></span></label>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${automaticScheduleRules.calculateExtraAutomatically ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-white'}`}><input type="checkbox" disabled={Boolean(automaticScheduleRules.ruleGroups?.length)} checked={!automaticScheduleRules.ruleGroups?.length && automaticScheduleRules.calculateExtraAutomatically} onChange={event => setAutomaticScheduleRules(previous => ({ ...previous, calculateExtraAutomatically: event.target.checked }))} className="mt-0.5 accent-violet-700" /><span><strong className="block text-[10px] text-slate-800">Calcular complemento automaticamente</strong><small className="mt-0.5 block text-[9px] leading-4 text-slate-500">Se a jornada prevista ficar abaixo da carga semanal, o saldo é sugerido como hora extra para revisão.</small></span></label>
                  </div>
                  </details>
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-[10px] text-slate-800">Regra persistente da empresa · versão {automaticScheduleRules.version || 1}</strong><p className="mt-0.5 text-[9px] leading-4 text-slate-500">Ao salvar, uma nova versão será registrada e vinculada às escalas publicadas.</p>{automaticScheduleRules.versionHistory?.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-[9px] font-bold text-cyan-800">Ver histórico de versões</summary><div className="mt-2 space-y-1">{automaticScheduleRules.versionHistory.slice().reverse().map(item => <p key={`${item.version}-${item.savedAt}`} className="text-[9px] text-slate-500">v{item.version} · {new Date(item.savedAt).toLocaleString('pt-BR')} · {item.savedBy || 'Responsável não informado'} · {item.summary}</p>)}</div></details>}</div><button type="button" disabled={isSavingScheduleRules} onClick={saveAutomaticScheduleRules} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{isSavingScheduleRules ? <LoaderCircle className="mr-1.5 inline h-4 w-4 animate-spin" /> : <Check className="mr-1.5 inline h-4 w-4" />}{isSavingScheduleRules ? 'Salvando...' : 'Salvar nova versão'}</button></div>
                </div> : automaticScheduleRuleTab === 'team' && canConfigureScheduleRules ? <div className="space-y-4 p-4">
                  <CoverageRequirementEditor embedded requirements={scheduleScopedCoverageRequirements} departments={scheduleScope.departments} canConfigure={canConfigureScheduleRules} onSave={saveScheduleCoverageRequirements} defaultDepartment={scheduleScope.departmentIds[0] || 'all'} ready={scheduleCoverageReady} error="" />
                </div> : <div className="space-y-4 p-4">
                  {!canConfigureScheduleRules && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-900"><strong className="block">Uso liberado; configuração protegida</strong>Você pode simular e publicar a escala com as regras existentes. A alteração de conjuntos, jornadas e exceções depende da permissão “Configurar regras da escala inteligente”.</div>}
                  <ScheduleConfigurationAudit compact audit={automaticScheduleConfigurationAudit} />
                  <div className="grid gap-3 rounded-xl border border-cyan-100 bg-white/80 p-3 sm:grid-cols-3"><label className="text-[9px] font-bold uppercase text-slate-600">Início do planejamento<input required type="date" value={bulkSchedule.startDate} onChange={event => { setBulkSchedule(previous => ({ ...previous, startDate: event.target.value })); setAutomaticScheduleProposal([]); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /></label><label className="text-[9px] font-bold uppercase text-slate-600">Fim do planejamento<input required type="date" value={bulkSchedule.endDate} onChange={event => { setBulkSchedule(previous => ({ ...previous, endDate: event.target.value })); setAutomaticScheduleProposal([]); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800" /></label><div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"><span className="text-[9px] font-bold uppercase text-slate-500">Equipe selecionada</span><strong className="mt-1 block text-lg text-slate-900">{bulkSchedule.userIds.length}</strong><small className="text-[9px] text-slate-500">{automaticScheduleRules.reuseLastSchedule ? `${automaticScheduleReusablePatterns} com padrão anterior encontrado` : 'Uso do padrão anterior desativado'}</small></div></div>
                  <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><span className="text-[9px] font-black uppercase text-blue-700">Jornada base</span><strong className="mt-1 block text-xs text-slate-900">Entrada até saída prevista</strong><p className="mt-1 text-[9px] leading-4 text-slate-500">É o tempo regular de trabalho, já descontando o intervalo.</p></div><div className="rounded-xl border border-violet-100 bg-violet-50 p-3"><span className="text-[9px] font-black uppercase text-violet-700">Hora extra</span><strong className="mt-1 block text-xs text-slate-900">Tempo adicional do dia</strong><p className="mt-1 text-[9px] leading-4 text-slate-500">É somada depois da saída base e altera somente a saída final.</p></div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><span className="text-[9px] font-black uppercase text-emerald-700">Carga total</span><strong className="mt-1 block text-xs text-slate-900">Base + extra</strong><p className="mt-1 text-[9px] leading-4 text-slate-500">Todos os totais são exibidos no padrão hh:mm.</p></div></div>
                  <div className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-[10px] text-amber-950">Feriados do período</strong><p className="mt-0.5 text-[10px] leading-4 text-slate-600">São os dias cadastrados no calendário como “Feriado”.</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ${automaticScheduleDetectedHolidays.length ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>{automaticScheduleDetectedHolidays.length ? `${automaticScheduleDetectedHolidays.length} detectado(s)` : 'Nenhum detectado'}</span></div>
                  <ScheduleHolidayPlanner key={activeCompany?.id || 'holiday-planner'} holidays={automaticScheduleDetectedHolidays} employees={scheduleScope.employees.filter(user => bulkSchedule.userIds.some(id => String(id) === String(user.id)))} rules={automaticScheduleRules} history={scheduleScopedSchedules} absences={scheduleScopedAbsences} startDate={bulkSchedule.startDate} assignments={automaticScheduleHolidayAssignments} onChange={assignments => { setAutomaticScheduleHolidayDraft({ companyId: activeCompany.id, assignments }); setAutomaticScheduleProposal([]); }} disabled={isSavingScheduleProposal || !schedulePlanningDataReady()} />
                  {(automaticScheduleRules.ruleGroups || []).length > 0 && <p className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-[11px] leading-5 text-cyan-900">As regras especiais serão respeitadas integralmente. Diferenças de carga serão indicadas para revisão; jornadas reduzidas não recebem complemento automático. Períodos que cobrem parte da semana exibem uma meta proporcional aos dias do período.</p>}
                  {!scheduleScopedCoverageRequirements.length && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Cadastre o mínimo de pessoas por setor e horário para gerar pela necessidade da operação. Sem essa meta, a simulação considera somente jornadas e folgas.{canConfigureScheduleRules && <button type="button" onClick={() => setAutomaticScheduleRuleTab('team')} className="ml-2 underline">Configurar necessidade</button>}</div>}
                  <div className="flex justify-end"><button type="button" onClick={generateAutomaticSchedule} className="rounded-xl bg-cyan-800 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-cyan-900"><Sparkles className="mr-1.5 inline h-4 w-4" />Gerar quadro para revisão</button></div>
                </div>}
              </section>
              {automaticScheduleProposal.length > 0 && <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70">
                <div className="flex flex-col gap-3 border-b border-emerald-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"><div><span className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">Quadro diário da equipe</span><h4 className="mt-1 text-base font-extrabold text-slate-950">Revise horários e carga de trabalho</h4><p className="mt-1 text-[11px] text-slate-500">Ajuste os dias livres da prévia. Lançamentos manuais, ausências e dias fixos são preservados.</p></div><button type="button" disabled={isSavingScheduleProposal} onClick={saveAutomaticScheduleProposal} className="disabled:cursor-not-allowed disabled:opacity-50 shrink-0 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"><CheckCircle2 className="mr-1.5 inline h-4 w-4" />{isSavingScheduleProposal ? 'Publicando...' : 'Salvar e publicar no calendário'}</button></div>
                <ScheduleOptimizationSummary before={automaticScheduleOptimization?.before} analysis={automaticScheduleCoverage} swaps={automaticScheduleOptimization?.swaps || 0} limited={automaticScheduleOptimization?.limited} requirements={scheduleScopedCoverageRequirements} fixedDays={automaticScheduleProposal.filter(isFixedProposalRow).length} selectedDate={automaticScheduleVisibleDate} departments={scheduleScope.departments} rows={automaticScheduleProposal} onSelectDate={reviewAutomaticScheduleDay} onReviewRules={canConfigureScheduleRules ? () => { setAutomaticScheduleRuleTab('rules'); automaticScheduleDayEditorRef.current?.closest('form')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); } : undefined} onOptimize={reorganizeAutomaticSchedule} disabled={isSavingScheduleProposal || automaticScheduleInput !== automaticScheduleProposalInput} />
                <ScheduleProposalCalendar rows={automaticScheduleProposal} analysis={automaticScheduleCoverage} issues={automaticScheduleIssues} selectedDate={automaticScheduleVisibleDate} onSelectDate={setAutomaticSchedulePreviewDate} onOpenDay={() => { automaticScheduleDayEditorRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); automaticScheduleDayEditorRef.current?.focus({ preventScroll: true }); }} disabled={isSavingScheduleProposal} />
                {automaticScheduleIssues.length > 0 && <div className="m-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3"><h5 className="text-xs font-bold text-amber-950">Validação da simulação · {automaticScheduleIssues.filter(issue => issue.blocking).length} bloqueio(s)</h5><ul className="max-h-44 space-y-1 overflow-auto text-[11px]">{automaticScheduleIssues.map((issue, index) => <li key={`${issue.key}-${index}`} className={issue.blocking ? 'text-rose-800' : 'text-amber-900'}><button type="button" className="text-left underline" onClick={() => openAutomaticScheduleProblem(issue)}>{issue.blocking ? 'Resolver: ' : 'Conferir: '}{issue.message}</button></li>)}</ul></div>}
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4"><div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><span className="text-[8px] font-black uppercase text-blue-700">Equipe no quadro</span><strong className="mt-1 block text-xl text-blue-950">{automaticScheduleVisibleRows.length}</strong></div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><span className="text-[8px] font-black uppercase text-emerald-700">Em trabalho</span><strong className="mt-1 block text-xl text-emerald-950">{automaticScheduleWorkingRows.length}</strong></div><div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><span className="text-[8px] font-black uppercase text-amber-700">Folgas / ausências</span><strong className="mt-1 block text-xl text-amber-950">{automaticScheduleVisibleRows.length - automaticScheduleWorkingRows.length}</strong></div><div className="rounded-xl border border-violet-100 bg-violet-50 p-3"><span className="text-[8px] font-black uppercase text-violet-700">Carga da equipe</span><strong className="mt-1 block text-xl text-violet-950">{scheduleDurationToText(automaticScheduleDayHours)}</strong></div></div>
                <ScheduleDayEditor problem={automaticScheduleProblem} issues={automaticScheduleIssues} onClearProblem={() => setAutomaticScheduleProblem(null)} onOptimize={reorganizeAutomaticSchedule} sectionRef={automaticScheduleDayEditorRef} key={automaticScheduleProposalInput} rows={automaticScheduleVisibleRows} date={automaticScheduleVisibleDate} departments={scheduleScope.departments} disabled={isSavingScheduleProposal} canConfigureRules={canConfigureScheduleRules} onChange={updateAutomaticScheduleRow} onStatusChange={changeAutomaticScheduleStatus} onToggleLock={toggleAutomaticScheduleDayLock} onRepeatOvertime={repeatAutomaticScheduleOvertime} onCreateRule={createRecurringRuleFromDay} getHours={automaticScheduleRowHours} formatDuration={scheduleDurationToText} parseHours={scheduleTextToHours} intervalMinutes={scheduleIntervalMinutes} renderTable={() => (<div className="max-h-[430px] overflow-auto border-y border-emerald-100 bg-white"><table className="w-full min-w-[1320px] text-left text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr><th className="px-3 py-2.5">Colaborador</th><th className="px-3 py-2.5">Regra aplicada / motivo</th><th className="px-2 py-2.5">Status</th><th className="px-2 py-2.5">Entrada</th><th className="px-2 py-2.5">Saída prevista<br/><span className="font-medium text-slate-400">sem hora extra</span></th><th className="px-2 py-2.5">Início intervalo</th><th className="px-2 py-2.5">Fim intervalo</th><th className="px-2 py-2.5">Hora extra<br/><span className="font-medium text-slate-400">hh:mm</span></th><th className="px-2 py-2.5">Saída final</th><th className="px-3 py-2.5 text-right">Carga do dia</th></tr></thead><tbody>{automaticScheduleVisibleRows.map(renderAutomaticScheduleRow)}</tbody></table></div>)} />
                <div className="p-3"><h5 className="text-[9px] font-black uppercase tracking-wide text-slate-500">Carga total no período por colaborador</h5><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{automaticScheduleEmployeeTotals.map(item => <div key={item.userId} className={`rounded-xl border bg-white p-3 ${Math.abs(item.balance) < 0.02 ? 'border-emerald-200' : item.balance < 0 ? 'border-rose-200' : 'border-violet-200'}`}><strong className="block truncate text-[10px] text-slate-800">{item.userName}</strong><div className="mt-1 flex items-end justify-between gap-2"><span className="text-sm font-black text-slate-950">{scheduleDurationToText(item.total)}</span><span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${Math.abs(item.balance) < 0.02 ? 'bg-emerald-100 text-emerald-800' : item.balance < 0 ? 'bg-rose-100 text-rose-800' : 'bg-violet-100 text-violet-800'}`}>{Math.abs(item.balance) < 0.02 ? 'CARGA OK' : item.balance > 0 ? `EXTRA ${scheduleDurationToText(item.projectedOvertime)}` : `FALTA ${scheduleDurationToText(item.missingHours)}`}</span></div><small className="mt-1 block text-[8px] text-slate-500">Meta {scheduleDurationToText(item.target)} · jornada base {scheduleDurationToText(item.regular)} · complemento sugerido {scheduleDurationToText(item.extra)}</small></div>)}</div></div>
                {automaticScheduleEmployeeTotals.some(item => item.missingHours > 0.02) && <p className="m-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] font-semibold text-amber-800">Há colaboradores com carga abaixo da meta. Confira as folgas e jornadas especiais antes de publicar. Com conjuntos de regras, horários reduzidos são preservados e não recebem complemento automático.</p>}
                {automaticScheduleProposal.some(isProtectedProposalRow) && <p className="m-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-[10px] font-semibold text-cyan-900">Marcações manuais e ausências existentes serão preservadas. Apenas os blocos automáticos liberados dentro do período serão substituídos.</p>}
              </section>}
              </>}
              {bulkScheduleMode === 'manual' && <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-[10px] font-bold uppercase text-slate-500">Início<input required type="date" value={bulkSchedule.startDate} onChange={event => setBulkSchedule(previous => ({ ...previous, startDate: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700" /></label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Fim<input required type="date" value={bulkSchedule.endDate} onChange={event => setBulkSchedule(previous => ({ ...previous, endDate: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700" /></label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Status<select value={bulkSchedule.status} onChange={event => setBulkSchedule(previous => ({ ...previous, status: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"><option value="Folga">Folga</option><option value="Presencial">Presencial</option><option value="Home Office">Home Office</option></select></label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Turno<select value={bulkSchedule.shift || 'Integral'} onChange={event => setBulkSchedule(previous => ({ ...previous, shift: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"><option value="Integral">Integral</option><option value="Manhã">Manhã</option><option value="Tarde">Tarde</option><option value="Noite">Noite</option><option value="Personalizado">Personalizado</option></select></label>
              </div>
              {bulkSchedule.shift === 'Personalizado' && <div className="grid grid-cols-1 gap-3 rounded-xl border border-violet-100 bg-violet-50 p-3 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase text-violet-700">Início do turno<input required type="time" value={bulkSchedule.customShiftStart} onChange={event => setBulkSchedule(previous => ({ ...previous, customShiftStart: event.target.value }))} className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-xs text-slate-700" /></label><label className="text-[10px] font-bold uppercase text-violet-700">Fim do turno<input required type="time" value={bulkSchedule.customShiftEnd} onChange={event => setBulkSchedule(previous => ({ ...previous, customShiftEnd: event.target.value }))} className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-xs text-slate-700" /></label></div>}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase text-violet-700">Repetir este período<select value={bulkSchedule.repeatInterval || 'semanal'} onChange={event => setBulkSchedule(previous => ({ ...previous, repeatInterval: event.target.value }))} className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"><option value="semanal">Semanalmente</option><option value="quinzenal">A cada 15 dias</option><option value="mensal">Mensalmente</option></select></label>
                <label className="text-[10px] font-bold uppercase text-violet-700">Quantidade de marcações<input required min="1" max="52" type="number" value={bulkSchedule.repeatCount || 1} onChange={event => setBulkSchedule(previous => ({ ...previous, repeatCount: Math.min(52, Math.max(1, Number(event.target.value) || 1)) }))} className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-xs text-slate-700" /><span className="mt-1 block normal-case font-medium text-violet-600">1 significa somente este período.</span></label>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-950"><strong>Prévia no calendário:</strong> {bulkScheduleConsecutiveDays || 0} dia(s) consecutivo(s), {bulkSchedulePreview.length} marcação(ões) por pessoa. <span className="block pt-1 text-[11px] text-violet-700">{bulkSchedulePreview.map(period => `${formatDate(period.startDate)}${period.endDate !== period.startDate ? ` a ${formatDate(period.endDate)}` : ''}`).join(' · ')}</span></div>
              </>}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-[10px] font-bold uppercase text-slate-500">Setor<select value={bulkSchedule.dept} onChange={event => setBulkSchedule(previous => ({ ...previous, dept: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value="Todos">Todos os setores</option>{scheduleScope.departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Cargo<select value={bulkSchedule.role || 'Todos'} onChange={event => setBulkSchedule(previous => ({ ...previous, role: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value="Todos">Todos os cargos</option>{uniqueRoles.sort((a, b) => a.localeCompare(b, 'pt-BR')).map(role => <option key={role} value={role}>{role}</option>)}</select></label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Seleção<select value={bulkSchedule.selectionFilter || 'Todos'} onChange={event => setBulkSchedule(previous => ({ ...previous, selectionFilter: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value="Todos">Todos</option><option value="Selecionados">Selecionados</option><option value="Não selecionados">Não selecionados</option></select></label>
                <label className="text-[10px] font-bold uppercase text-slate-500">Buscar colaborador<input value={bulkSchedule.employeeSearch || ''} onChange={event => setBulkSchedule(previous => ({ ...previous, employeeSearch: event.target.value }))} placeholder="Nome ou cargo" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700" /></label>
              </div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-semibold text-slate-500">{bulkScheduleVisibleEmployees.length} visível(is) · {bulkSchedule.userIds.length} selecionado(s)</span><div className="flex flex-wrap gap-2"><button type="button" disabled={!bulkScheduleVisibleEmployees.length} onClick={() => { setBulkSchedule(previous => ({ ...previous, userIds: [...new Set([...previous.userIds, ...bulkScheduleVisibleEmployees.map(user => user.id)])] })); setAutomaticScheduleProposal([]); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">Selecionar visíveis</button><button type="button" disabled={!bulkScheduleVisibleEmployees.length} onClick={() => { const visibleIds = new Set(bulkScheduleVisibleEmployees.map(user => String(user.id))); setBulkSchedule(previous => ({ ...previous, userIds: previous.userIds.filter(id => !visibleIds.has(String(id))) })); setAutomaticScheduleProposal([]); }} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40">Desmarcar visíveis</button><button type="button" disabled={!bulkSchedule.userIds.length} onClick={() => { setBulkSchedule(previous => ({ ...previous, userIds: [] })); setAutomaticScheduleProposal([]); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40">Limpar seleção</button></div></div></div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid sm:grid-cols-2 sm:gap-1 lg:grid-cols-3">
                {bulkScheduleVisibleEmployees.length === 0 ? <p className="p-3 text-center text-xs text-slate-500">Nenhum colaborador encontrado para esse filtro.</p> : bulkScheduleVisibleEmployees.map(user => <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-slate-50"><input type="checkbox" checked={bulkSchedule.userIds.includes(user.id)} onChange={event => { setBulkSchedule(previous => ({ ...previous, userIds: event.target.checked ? [...new Set([...previous.userIds, user.id])] : previous.userIds.filter(id => id !== user.id) })); setAutomaticScheduleProposal([]); }} className="accent-violet-600" /><span className="min-w-0"><strong className="block truncate text-slate-800">{user.name}</strong><small className="text-slate-500">{scheduleScope.departments.find(dept => dept.id === getUserDepts(user)[0])?.name || user.role}</small></span></label>)}
              </div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Observação da escala (opcional)<input maxLength="250" value={bulkSchedule.notes} onChange={event => setBulkSchedule(previous => ({ ...previous, notes: event.target.value }))} placeholder="Ex.: Cobertura de feriado" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700" /></label>
              <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setShowBulkScheduleModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button>{bulkScheduleMode === 'manual' ? <button type="submit" className="rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-800">Salvar escala para {bulkSchedule.userIds.length} pessoa(s)</button> : !automaticScheduleProposal.length ? <button type="button" onClick={generateAutomaticSchedule} className="rounded-xl bg-cyan-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-900"><Sparkles className="mr-1.5 inline h-4 w-4" />Gerar quadro da equipe</button> : null}</div>
            </fieldset></form>
          </div>
        </div>
      )}

      {careerDecisionDraft && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white"><div><h3 className="text-sm font-extrabold">{careerDecisionDraft.outcome === 'approved' ? 'Pré-selecionar candidato' : 'Descartar candidatura'}</h3><p className="mt-0.5 text-[10px] text-slate-300">{careerDecisionDraft.application.name} · {careerDecisionDraft.application.vacancyTitle}</p></div><button type="button" onClick={() => setCareerDecisionDraft(null)} aria-label="Fechar"><X className="h-5 w-5" /></button></div><form onSubmit={saveCareerDecision} className="space-y-3 p-5"><label className="block text-[10px] font-bold uppercase text-slate-500">Mensagem para o candidato<textarea required maxLength="1600" value={careerDecisionDraft.message} onChange={event => setCareerDecisionDraft(previous => ({ ...previous, message: event.target.value }))} className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700" /></label><label className="block text-[10px] font-bold uppercase text-slate-500">Anotação interna (opcional)<input maxLength="400" value={careerDecisionDraft.internalNote} onChange={event => setCareerDecisionDraft(previous => ({ ...previous, internalNote: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700" placeholder="Motivo ou observação para a equipe" /></label><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={careerDecisionDraft.openEmail} onChange={event => setCareerDecisionDraft(previous => ({ ...previous, openEmail: event.target.checked }))} /> Abrir e-mail já preenchido após registrar</label><p className="text-[10px] leading-relaxed text-slate-500">A atualização aparece imediatamente no portal do candidato. O e-mail será preparado no aplicativo de e-mail do recrutador para revisão e envio.</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setCareerDecisionDraft(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancelar</button><button type="submit" className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white ${careerDecisionDraft.outcome === 'approved' ? 'bg-blue-700' : 'bg-rose-700'}`}>{careerDecisionDraft.outcome === 'approved' ? 'Confirmar pré-seleção' : 'Confirmar descarte'}</button></div></form></div></div>
      )}

      {careerInterviewDraft && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between bg-violet-950 px-5 py-4 text-white"><div><h3 className="text-sm font-extrabold">Agendar entrevista</h3><p className="mt-0.5 text-[10px] text-violet-200">{careerInterviewDraft.application.name} · {careerInterviewDraft.application.vacancyTitle}</p></div><button type="button" onClick={() => setCareerInterviewDraft(null)} aria-label="Fechar"><X className="h-5 w-5" /></button></div><form onSubmit={saveCareerInterview} className="space-y-3 p-5"><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="text-[10px] font-bold uppercase text-slate-500">Data<input required type="date" value={careerInterviewDraft.date} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, date: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" /></label><label className="text-[10px] font-bold uppercase text-slate-500">Horário<input required type="time" value={careerInterviewDraft.time} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, time: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" /></label><label className="text-[10px] font-bold uppercase text-slate-500">Formato<select value={careerInterviewDraft.format} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, format: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"><option>Online</option><option>Presencial</option><option>Telefone</option></select></label></div><label className="block text-[10px] font-bold uppercase text-slate-500">Local ou link (opcional)<input maxLength="300" value={careerInterviewDraft.location} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, location: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" placeholder="Ex.: Link da videochamada ou endereço" /></label><label className="block text-[10px] font-bold uppercase text-slate-500">Contato para confirmação<input required maxLength="160" value={careerInterviewDraft.contact} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, contact: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" placeholder="E-mail, telefone ou nome do recrutador" /></label><label className="block text-[10px] font-bold uppercase text-slate-500">Mensagem ao candidato (opcional)<textarea maxLength="1600" value={careerInterviewDraft.message} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, message: event.target.value }))} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" placeholder="Se vazio, a plataforma gera uma mensagem com data, horário e contato." /></label><label className="block text-[10px] font-bold uppercase text-slate-500">Anotação interna (opcional)<input maxLength="400" value={careerInterviewDraft.internalNote} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, internalNote: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" /></label><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={careerInterviewDraft.openEmail} onChange={event => setCareerInterviewDraft(previous => ({ ...previous, openEmail: event.target.checked }))} /> Abrir e-mail já preenchido após registrar</label><div className="flex justify-end gap-2"><button type="button" onClick={() => setCareerInterviewDraft(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancelar</button><button type="submit" className="rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white">Agendar entrevista</button></div></form></div></div>
      )}

      {/* REGISTRO DE AUSÊNCIA DETALHADO */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Clock className="h-5 w-5 text-slate-300" /> Agendar Ausência no Expediente
              </h3>
              <button type="button" onClick={() => setShowAbsenceModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitAbsence} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Colaborador</label>
                {currentUser.isAdmin || currentUser.isDeveloper || isManager || effectiveAccessProfile.canPublishAbsenceForOthers === true ? (
                  <select required value={newAbsence.targetUserId || currentUser.id} onChange={event => setNewAbsence(previous => ({ ...previous, targetUserId: event.target.value }))} className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                    {employeesList.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR')).map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                ) : <input type="text" readOnly value={currentUser.name} className="px-3.5 py-2.5 w-full bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs focus:outline-none cursor-not-allowed" />}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data de Início</label>
                  <input
                    type="date"
                    required
                    value={newAbsence.startDate}
                    onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data de Término</label>
                  <input
                    type="date"
                    required
                    value={newAbsence.endDate}
                    onChange={(e) => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Horário de Início</label>
                  <input
                    type="time"
                    required
                    value={newAbsence.startTime}
                    onChange={(e) => setNewAbsence({ ...newAbsence, startTime: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Horário de Término</label>
                  <input
                    type="time"
                    required
                    value={newAbsence.endTime}
                    onChange={(e) => setNewAbsence({ ...newAbsence, endTime: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Motivação / Justificativa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consulta médica, Assuntos de família, Licença..."
                  value={newAbsence.reason}
                  onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowAbsenceModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                  Registrar Ausência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRO DE EVENTO DE CALENDÁRIO */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Calendar className="h-5 w-5 text-slate-300" /> Agendar Novo Evento de Calendário
              </h3>
              <button type="button" onClick={() => setShowEventModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitEvent} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião Geral de Marketing, Confraternização..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data Prevista</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Encontro</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="Confraternização">Confraternização</option>
                    <option value="Aviso Técnico">Aviso Técnico</option>
                    <option value="Regras e Políticas">Regras e Políticas</option>
                    <option value="Reunião">Reunião de Alinhamento</option>
                    <option value="Feriado">Feriado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Local / Link do Encontro</label>
                <input
                  type="text"
                  placeholder="Ex: Refeitório Sede, Link do Google Meet..."
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Informações Adicionais</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Insira os detalhes do cronograma e o que trazer..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                ></textarea>
                <BotaoEmoji aoSelecionar={(emoji) => setNewEvent(prev => ({ ...prev, description: prev.description + emoji }))} />
                <PreviaEmojis texto={newEvent.description} />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                  Cadastrar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRO OU ATUALIZAÇÃO DE COLABORADORES */}
      {pinResetTarget && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); if (!pinResetSaving) setPinResetTarget(null); } }}>
          <form onSubmit={submitAdminPinReset} role="dialog" aria-modal="true" aria-labelledby="reset-pin-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 id="reset-pin-title" className="font-bold text-slate-900">Redefinir PIN</h2>
              <button type="button" disabled={pinResetSaving} aria-label="Fechar" onClick={() => setPinResetTarget(null)}><X className="h-5 w-5" /></button>
            </div>
            <p className="my-4 text-sm text-slate-600">{pinResetTarget.userName}</p>
            <label className="block text-sm">Novo PIN
              <input autoFocus required type="password" autoComplete="new-password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={adminNewPin} onChange={e => setAdminNewPin(e.target.value.replace(/\D/g, ''))} className="my-2 w-full rounded-lg border p-3" />
            </label>
            <label className="block text-sm">Confirmar PIN
              <input required type="password" autoComplete="new-password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={adminConfirmPin} onChange={e => setAdminConfirmPin(e.target.value.replace(/\D/g, ''))} className="my-2 w-full rounded-lg border p-3" />
            </label>
            <button disabled={pinResetSaving} className="mt-3 w-full rounded-lg bg-slate-900 p-3 text-white disabled:opacity-50">{pinResetSaving ? 'Salvando…' : 'Confirmar novo PIN'}</button>
          </form>
        </div>
      )}
      {pendingContentDeletion && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/70 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !isDeletingContent) setPendingContentDeletion(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-content-title" aria-describedby="delete-content-description" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600"><Trash2 className="h-5 w-5" /></span><div><span className="text-[9px] font-black uppercase tracking-[.15em] text-rose-600">Confirme antes de continuar</span><h2 id="delete-content-title" className="mt-1 text-lg font-extrabold text-slate-900">{pendingContentDeletion.heading}</h2></div></div><button type="button" disabled={isDeletingContent} onClick={() => setPendingContentDeletion(null)} aria-label="Cancelar exclusão" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/60 p-4"><strong className="block break-words text-sm text-slate-900">{pendingContentDeletion.title}</strong><p id="delete-content-description" className="mt-2 text-xs leading-5 text-slate-600">{pendingContentDeletion.detail}</p></div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={isDeletingContent} onClick={() => setPendingContentDeletion(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Manter publicação</button><button type="button" disabled={isDeletingContent} onClick={confirmContentDeletion} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60">{isDeletingContent ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{isDeletingContent ? 'Excluindo…' : 'Sim, excluir'}</button></div>
          </div>
        </div>
      )}
      {pendingUserRemoval && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/65 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="remove-user-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><span className="rounded-xl bg-rose-50 p-2.5 text-rose-600"><Trash2 className="h-5 w-5" /></span><h2 id="remove-user-title" className="text-lg font-bold text-slate-900">Remover colaborador?</h2></div>
              <button type="button" disabled={isRemovingUser} onClick={() => setPendingUserRemoval(null)} aria-label="Cancelar remoção" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">{pendingUserRemoval.name}</strong> deixará de aparecer na equipe e no painel de presença. Esta ação não pode ser desfeita por esta tela.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={isRemovingUser} onClick={() => setPendingUserRemoval(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={isRemovingUser} onClick={() => handleDeleteUser(pendingUserRemoval.id)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{isRemovingUser ? 'Removendo…' : 'Remover colaborador'}</button>
            </div>
          </div>
        </div>
      )}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Users className="h-5 w-5 text-slate-300" /> {editingUser ? 'Atualizar Perfil de Funcionário' : 'Cadastrar Novo Integrante na Empresa'}
              </h3>
              <button type="button" onClick={() => setShowUserModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitUserForm} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Data de nascimento</label>
                  <input type="date" value={userForm.birthDate || ''} onChange={(e) => setUserForm({ ...userForm, birthDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Data de admissão</label>
                  <input type="date" value={userForm.hireDate || ''} onChange={(e) => setUserForm({ ...userForm, hireDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Setores Vinculados (Múltipla Escolha)</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {departmentsList.map((dept) => (
                      <label key={dept.id} className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                        <input
                          type="checkbox"
                          checked={(userForm.depts || []).includes(dept.id)}
                          onChange={(e) => {
                            const newDepts = e.target.checked
                              ? [...(userForm.depts || []), dept.id]
                              : (userForm.depts || []).filter(id => id !== dept.id);
                            setUserForm({ ...userForm, depts: newDepts, role: '' });
                          }}
                          className="rounded text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700">{dept.name}</span>
                      </label>
                    ))}
                    {(userForm.depts || []).length === 0 && (
                      <span className="text-[10px] text-rose-500 font-bold w-full">⚠️ Selecione pelo menos um setor.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-black text-slate-900">Cargo Principal Atribuído</label>
                  <select
                    required
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                    disabled={(userForm.depts || []).length === 0}
                  >
                    <option value="" disabled>Selecione um cargo...</option>
                    {rolesList
                      .filter(role => getRoleDepts(role).some(deptId => (userForm.depts || []).includes(deptId)))
                      .map((role) => {
                        const deptNames = getRoleDepts(role)
                          .filter(deptId => (userForm.depts || []).includes(deptId))
                          .map(deptId => departmentsList.find(d => d.id === deptId)?.name || deptId)
                          .join(', ');
                        return (
                          <option key={role.id || role.name} value={role.name}>
                            {role.name} ({deptNames})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vincular a Grupo de Produção (Opcional)</label>
                  <select
                    value={userForm.prodGroup || ''}
                    onChange={(e) => setUserForm({ ...userForm, prodGroup: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="">Nenhum Grupo Específico</option>
                    <option value="Máquina 1">Máquina 1</option>
                    <option value="Máquina 2">Máquina 2</option>
                    <option value="Laje">Laje</option>
                    <option value="Mourão">Mourão</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Supervisor ou gestor responsável</label>
                  <select
                    value={userForm.managerId || ''}
                    onChange={(e) => setUserForm({ ...userForm, managerId: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="">Nenhum gestor definido</option>
                    {employeesList
                      .filter(manager => manager.id !== editingUser?.id)
                      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' }))
                      .map(manager => <option key={manager.id} value={manager.id}>{manager.name} — {manager.role || 'Cargo não informado'}</option>)}
                  </select>
                  <span className="mt-1 block text-[9px] text-slate-400">Esse vínculo aparecerá na ficha e na visão gerencial da equipe.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Foto de Perfil (Upload)</label>
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl px-3.5 h-10 w-full flex items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <ImageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">Escolher imagem...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setUserForm, 'avatar')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{editingUser ? 'PIN preservado — use Redefinir PIN para alterar' : 'PIN numérico de Acesso'}</label>
                  <input
                    type="text"
                    maxLength="4"
                    required
                    disabled={Boolean(editingUser)}
                    placeholder={editingUser ? 'Não exibido por segurança' : 'PIN numérico'}
                    value={userForm.pin}
                    onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, '') })}
                    className="px-3.5 h-10 w-full rounded-xl border border-slate-200 text-xs focus:outline-none tracking-widest text-center font-bold"
                  />
                </div>
              </div>

              {userForm.avatar && (
                <div className="flex justify-center -mt-1 mb-1 animate-in zoom-in">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 shadow-sm">
                    <img src={userForm.avatar} className="w-full h-full object-cover" alt="Prévia do Avatar" />
                    <button
                      type="button"
                      onClick={() => setUserForm(prev => ({ ...prev, avatar: '' }))}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full shadow backdrop-blur-sm transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* CAMPOS SEPARADOS DE CONTATO DE EMERGÊNCIA (CADASTRO ADM) */}
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">CONTATO DE EMERGÊNCIA</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nome</label>
                    <input
                      type="text"
                      placeholder="Ex: Maria"
                      value={userForm.emergencyName}
                      onChange={(e) => setUserForm({ ...userForm, emergencyName: e.target.value })}
                      className="px-3 py-2 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Parentesco</label>
                    <input
                      type="text"
                      placeholder="Ex: Esposa"
                      value={userForm.emergencyRelationship}
                      onChange={(e) => setUserForm({ ...userForm, emergencyRelationship: e.target.value })}
                      className="px-3 py-2 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700 bg-slate-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Contato / Telefone</label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: (71) 98888-8888"
                      value={userForm.emergencyPhone}
                      onChange={(e) => setUserForm({ ...userForm, emergencyPhone: e.target.value })}
                      className="pl-9 pr-3 py-2 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={userForm.isAdmin}
                  onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
                <label htmlFor="isAdmin" className="text-xs font-bold text-slate-600">Conceder Acesso de Administrador</label>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENQUETE */}
      {showPollModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-3 sm:p-4">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-800 px-5 py-4 text-white sm:px-6"><div><h3 className="text-sm font-extrabold">Criar pesquisa</h3><p className="mt-0.5 text-[10px] text-blue-100/75">Monte as perguntas visualmente e publique no feed da equipe.</p></div><button type="button" onClick={() => setShowPollModal(false)} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-5 w-5" /></button></div>
            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 p-5 sm:px-6"><button type="button" onClick={() => setPollCreationMode('enquete')} className={`rounded-xl border p-3 text-left transition ${pollCreationMode === 'enquete' ? 'border-cyan-300 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><strong className="block text-xs">Enquete rápida</strong><span className="mt-1 block text-[10px]">Uma pergunta para resposta imediata.</span></button><button type="button" onClick={() => setPollCreationMode('formulario')} className={`rounded-xl border p-3 text-left transition ${pollCreationMode === 'formulario' ? 'border-blue-300 bg-blue-50 text-blue-950 ring-2 ring-blue-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><strong className="block text-xs">Pesquisa completa</strong><span className="mt-1 block text-[10px]">Várias perguntas em um formulário.</span></button></div>

            {pollCreationMode === 'enquete' ? <form onSubmit={handleSavePoll} className="flex flex-col gap-5 p-5 sm:p-6">
              <section><div className="mb-3 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-700 text-[10px] font-extrabold text-white">1</span><div><h4 className="text-sm font-extrabold text-slate-800">Configure a pergunta</h4><p className="text-[10px] text-slate-500">Escolha uma categoria e o formato da resposta.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Categoria<select value={newPoll.category} onChange={event => setNewPoll(previous => ({ ...previous, category: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option>Pulso da equipe</option><option>Pesquisa de clima</option><option>Comunicação interna</option><option>Segurança e bem-estar</option><option>Sugestões</option><option>Outro tema</option></select></label><label className="text-xs font-bold text-slate-700">Formato da resposta<select value={newPoll.type} onChange={event => { const type = event.target.value; setNewPoll(previous => ({ ...previous, type, options: [...POLL_QUESTION_TYPES[type].options] })); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">{Object.entries(POLL_QUESTION_TYPES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label><label className="text-xs font-bold text-slate-700 sm:col-span-2">Pergunta<input required maxLength={240} value={newPoll.question} onChange={event => setNewPoll(previous => ({ ...previous, question: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Ex.: Como você avalia a comunicação desta semana?" /></label></div><p className="mt-2 text-[10px] text-slate-500">{POLL_QUESTION_TYPES[newPoll.type]?.hint}</p></section>
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><h4 className="text-xs font-extrabold text-slate-800">Alternativas</h4><span className="text-[10px] text-slate-400">{newPoll.options.length} opções</span></div>{newPoll.type === 'single' ? <div className="mt-3 space-y-2">{newPoll.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-400">{optionIndex + 1}</span><input required value={option} onChange={event => setNewPoll(previous => ({ ...previous, options: previous.options.map((value, index) => index === optionIndex ? event.target.value : value) }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs" placeholder={`Alternativa ${optionIndex + 1}`} />{newPoll.options.length > 2 && <button type="button" onClick={() => setNewPoll(previous => ({ ...previous, options: previous.options.filter((_, index) => index !== optionIndex) }))} className="px-2 text-sm font-bold text-rose-600">×</button>}</div>)}{newPoll.options.length < 8 && <button type="button" onClick={() => setNewPoll(previous => ({ ...previous, options: [...previous.options, ''] }))} className="mt-1 text-xs font-bold text-cyan-800">+ Adicionar alternativa</button>}</div> : <div className="mt-3 flex flex-wrap gap-2">{newPoll.options.map(option => <span key={option} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"><TextoComEmojis texto={option} /></span>)}</div>}</section>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Receber respostas até (opcional)<input type="date" value={newPoll.expiresAt} onChange={event => setNewPoll(previous => ({ ...previous, expiresAt: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><div className="rounded-xl bg-cyan-50 p-3 text-[10px] leading-relaxed text-cyan-900"><strong>Publicação automática</strong><br />A enquete aparecerá na timeline e no sino de notificações dos colaboradores.</div></div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowPollModal(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500">Cancelar</button><button type="submit" className="rounded-xl bg-cyan-800 px-5 py-2.5 text-xs font-extrabold text-white shadow hover:bg-cyan-900">Publicar enquete</button></div>
            </form> : <form onSubmit={handleSavePollForm} className="flex flex-col gap-5 p-5 sm:p-6">
              <section><div className="mb-3 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-700 text-[10px] font-extrabold text-white">1</span><div><h4 className="text-sm font-extrabold text-slate-800">Identificação da pesquisa</h4><p className="text-[10px] text-slate-500">Dê contexto antes de apresentar as perguntas.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700 sm:col-span-2">Título<input required maxLength={140} value={newPollForm.title} onChange={event => setNewPollForm(previous => ({ ...previous, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" placeholder="Ex.: Pesquisa de clima — outubro" /></label><label className="text-xs font-bold text-slate-700 sm:col-span-2">Apresentação<textarea rows={3} maxLength={600} value={newPollForm.description} onChange={event => setNewPollForm(previous => ({ ...previous, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" placeholder="Explique o objetivo e como as respostas serão utilizadas." /></label><label className="text-xs font-bold text-slate-700">Categoria<select value={newPollForm.category} onChange={event => setNewPollForm(previous => ({ ...previous, category: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option>Pesquisa de clima</option><option>Pulso da equipe</option><option>Comunicação interna</option><option>Segurança e bem-estar</option><option>Sugestões</option><option>Outro tema</option></select></label><label className="text-xs font-bold text-slate-700">Receber respostas até<input type="date" value={newPollForm.expiresAt} onChange={event => setNewPollForm(previous => ({ ...previous, expiresAt: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label></div></section>
              <section><div className="mb-3 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-700 text-[10px] font-extrabold text-white">2</span><div><h4 className="text-sm font-extrabold text-slate-800">Monte as perguntas</h4><p className="text-[10px] text-slate-500">Adicione até 10 perguntas e escolha o formato de cada uma.</p></div></div><div className="flex flex-wrap gap-2">{Object.entries(POLL_QUESTION_TYPES).map(([type, item]) => <button key={type} type="button" disabled={newPollForm.questions.length >= 10} onClick={() => setNewPollForm(previous => ({ ...previous, questions: [...previous.questions, createPollQuestion(type)] }))} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-40">+ {item.label}</button>)}</div><div className="mt-3 space-y-3">{newPollForm.questions.map((question, questionIndex) => <div key={questionIndex} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pergunta {questionIndex + 1}</span>{newPollForm.questions.length > 1 && <button type="button" onClick={() => setNewPollForm(previous => ({ ...previous, questions: previous.questions.filter((_, index) => index !== questionIndex) }))} className="text-[10px] font-bold text-rose-600">Remover</button>}</div><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px]"><input required maxLength={240} value={question.question} onChange={event => setNewPollForm(previous => ({ ...previous, questions: previous.questions.map((item, index) => index === questionIndex ? { ...item, question: event.target.value } : item) }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" placeholder="Escreva a pergunta" /><select value={question.type} onChange={event => { const type = event.target.value; setNewPollForm(previous => ({ ...previous, questions: previous.questions.map((item, index) => index === questionIndex ? { ...item, type, options: [...POLL_QUESTION_TYPES[type].options] } : item) })); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold">{Object.entries(POLL_QUESTION_TYPES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></div><p className="mt-2 text-[10px] text-slate-500">{POLL_QUESTION_TYPES[question.type]?.hint}</p>{question.type === 'single' ? <div className="mt-3 space-y-2">{question.options.map((option, optionIndex) => <div key={optionIndex} className="flex gap-2"><input required value={option} onChange={event => setNewPollForm(previous => ({ ...previous, questions: previous.questions.map((item, index) => index === questionIndex ? { ...item, options: item.options.map((value, current) => current === optionIndex ? event.target.value : value) } : item) }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" placeholder={`Alternativa ${optionIndex + 1}`} />{question.options.length > 2 && <button type="button" onClick={() => setNewPollForm(previous => ({ ...previous, questions: previous.questions.map((item, index) => index === questionIndex ? { ...item, options: item.options.filter((_, current) => current !== optionIndex) } : item) }))} className="px-2 text-xs font-bold text-rose-600">×</button>}</div>)}{question.options.length < 8 && <button type="button" onClick={() => setNewPollForm(previous => ({ ...previous, questions: previous.questions.map((item, index) => index === questionIndex ? { ...item, options: [...item.options, ''] } : item) }))} className="text-xs font-bold text-blue-700">+ Adicionar alternativa</button>}</div> : <div className="mt-3 flex flex-wrap gap-1.5">{question.options.map(option => <span key={option} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"><TextoComEmojis texto={option} /></span>)}</div>}</div>)}</div></section>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] leading-relaxed text-blue-900"><strong>Uma publicação, várias perguntas</strong><br />O formulário aparecerá apenas uma vez na timeline. Ao abrir, o colaborador encontrará todas as perguntas organizadas nesta página.</div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowPollModal(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500">Cancelar</button><button type="submit" className="rounded-xl bg-blue-800 px-5 py-2.5 text-xs font-extrabold text-white shadow hover:bg-blue-900">Publicar pesquisa</button></div>
            </form>}
          </div>
        </div>
      )}

      {showVacancyModal && isCareerManagerUser(currentUser) && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white"><div><h3 className="text-sm font-extrabold">Publicar vaga</h3><p className="mt-0.5 text-[10px] text-slate-300">Preencha os dados e monte um questionário de forma visual.</p></div><button type="button" onClick={() => setShowVacancyModal(false)} aria-label="Fechar" className="rounded p-1 hover:bg-slate-800"><X className="h-5 w-5" /></button></div><form onSubmit={handleSaveVacancy} className="flex flex-col gap-5 p-6"><section><div className="mb-3 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-700 text-[10px] font-extrabold text-white">1</span><h4 className="text-sm font-extrabold text-slate-800">Sobre a vaga</h4></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700 sm:col-span-2">Cargo já cadastrado<select value={newVacancy.roleId} onChange={event => { const roleId = event.target.value; const selectedRole = rolesList.find(role => role.id === roleId); setNewVacancy(previous => ({ ...previous, roleId, title: selectedRole?.name || previous.title, description: selectedRole?.description || previous.description })); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="">Criar uma vaga personalizada</option>{rolesList.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select><span className="mt-1 block text-[10px] font-medium text-slate-400">Ao selecionar, o título e o descritivo das atividades serão preenchidos automaticamente e poderão ser ajustados.</span></label><label className="text-xs font-bold text-slate-700 sm:col-span-2">Título da vaga<input required maxLength={120} value={newVacancy.title} onChange={event => setNewVacancy(previous => ({ ...previous, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" placeholder="Ex.: Auxiliar de produção" /></label><label className="text-xs font-bold text-slate-700 sm:col-span-2">Descrição da vaga<textarea required rows={5} maxLength={4000} value={newVacancy.description} onChange={event => setNewVacancy(previous => ({ ...previous, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" placeholder="Explique atividades, requisitos, benefícios e condições da vaga." /></label><label className="text-xs font-bold text-slate-700">Local<input required maxLength={120} value={newVacancy.location} onChange={event => setNewVacancy(previous => ({ ...previous, location: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" placeholder="Ex.: Salvador, BA" /></label><label className="text-xs font-bold text-slate-700">Modalidade<select value={newVacancy.mode} onChange={event => setNewVacancy(previous => ({ ...previous, mode: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option>Presencial</option><option>Híbrido</option><option>Remoto</option></select></label></div></section><section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-700 text-[10px] font-extrabold text-white">2</span><div><h4 className="text-sm font-extrabold text-slate-800">Competências desejadas</h4><p className="text-[10px] text-slate-500">Usadas somente como apoio na triagem, nunca como decisão automática.</p></div></div><input value={newVacancy.skills} onChange={event => setNewVacancy(previous => ({ ...previous, skills: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" placeholder="Ex.: Excel, Comunicação, Operação de máquina" /><p className="mt-2 text-[10px] text-slate-500">Separe cada competência por vírgula.</p></section><section><div className="mb-3 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-700 text-[10px] font-extrabold text-white">3</span><div><h4 className="text-sm font-extrabold text-slate-800">Perguntas para a candidatura</h4><p className="text-[10px] text-slate-500">Opcional. Escolha o formato de cada pergunta antes de publicar.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" disabled={newVacancy.quiz.length >= 10} onClick={() => setNewVacancy(previous => ({ ...previous, quiz: [...previous.quiz, createVacancyQuestion('single')] }))} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-50">+ Escolha única</button><button type="button" disabled={newVacancy.quiz.length >= 10} onClick={() => setNewVacancy(previous => ({ ...previous, quiz: [...previous.quiz, createVacancyQuestion('yesNo')] }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">+ Sim ou não</button><button type="button" disabled={newVacancy.quiz.length >= 10} onClick={() => setNewVacancy(previous => ({ ...previous, quiz: [...previous.quiz, createVacancyQuestion('scale')] }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">+ Escala de 1 a 5</button></div><div className="mt-3 space-y-3">{newVacancy.quiz.map((question, questionIndex) => <div key={questionIndex} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pergunta {questionIndex + 1}</span><button type="button" onClick={() => setNewVacancy(previous => ({ ...previous, quiz: previous.quiz.filter((_, index) => index !== questionIndex) }))} className="text-[10px] font-bold text-rose-600">Remover</button></div><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px]"><input required value={question.question} onChange={event => setNewVacancy(previous => ({ ...previous, quiz: previous.quiz.map((item, index) => index === questionIndex ? { ...item, question: event.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs" placeholder="Escreva a pergunta para o candidato" /><select value={question.type} onChange={event => { const type = event.target.value; setNewVacancy(previous => ({ ...previous, quiz: previous.quiz.map((item, index) => index === questionIndex ? { ...item, type, options: [...VACANCY_QUESTION_TYPES[type].options] } : item) })); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold">{Object.entries(VACANCY_QUESTION_TYPES).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></div><p className="mt-2 text-[10px] text-slate-500">{VACANCY_QUESTION_TYPES[question.type]?.hint}</p>{question.type === 'single' ? <div className="mt-3 space-y-2">{question.options.map((option, optionIndex) => <div key={optionIndex} className="flex gap-2"><input required value={option} onChange={event => setNewVacancy(previous => ({ ...previous, quiz: previous.quiz.map((item, index) => index === questionIndex ? { ...item, options: item.options.map((value, current) => current === optionIndex ? event.target.value : value) } : item) }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder={`Alternativa ${optionIndex + 1}`} />{question.options.length > 2 && <button type="button" onClick={() => setNewVacancy(previous => ({ ...previous, quiz: previous.quiz.map((item, index) => index === questionIndex ? { ...item, options: item.options.filter((_, current) => current !== optionIndex) } : item) }))} className="px-2 text-xs font-bold text-rose-600">×</button>}</div>)}{question.options.length < 8 && <button type="button" onClick={() => setNewVacancy(previous => ({ ...previous, quiz: previous.quiz.map((item, index) => index === questionIndex ? { ...item, options: [...item.options, ''] } : item) }))} className="text-xs font-bold text-blue-700">+ Adicionar alternativa</button>}</div> : <div className="mt-3 flex flex-wrap gap-1.5">{question.options.map(option => <span key={option} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{option}</span>)}</div>}</div>)}</div>{!newVacancy.quiz.length && <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">Nenhuma pergunta adicionada. Você pode publicar a vaga sem questionário.</p>}</section><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Inscrições até (opcional)<input type="date" value={newVacancy.closesAt} onChange={event => setNewVacancy(previous => ({ ...previous, closesAt: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><div className="rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500"><strong className="text-slate-700">Antes de publicar</strong><br />Revise os requisitos e confirme se as perguntas são relevantes para a vaga.</div></div><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowVacancyModal(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500">Cancelar</button><button type="submit" className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white">Publicar vaga</button></div></form></div></div>
      )}

      {/* CENTRAL DE DOCUMENTOS */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white"><h3 className="flex items-center gap-2 text-sm font-extrabold"><FileText className="h-5 w-5 text-slate-300" /> Adicionar documento</h3><button type="button" disabled={isUploadingDocument || isSavingDocument} onClick={() => setShowDocumentModal(false)} className="rounded p-1 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSaveDocument} className="flex flex-col gap-4 p-6">
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Título</label><input required value={newDocument.title} onChange={event => setNewDocument(previous => ({ ...previous, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" placeholder="Ex.: Manual de integração" /></div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><label className="mb-2 block text-[10px] font-bold uppercase text-blue-800">Quem pode acessar este documento?</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><button type="button" onClick={() => setNewDocument(previous => ({ ...previous, accessMode: 'company', dept: 'all', allowedUserIds: [] }))} className={`rounded-xl border p-3 text-left text-xs transition ${newDocument.accessMode === 'company' ? 'border-blue-600 bg-white text-blue-900 shadow-sm' : 'border-transparent bg-white/60 text-slate-600'}`}><strong className="block">Toda a empresa</strong><span className="mt-1 block text-[10px]">Todos os colaboradores</span></button><button type="button" onClick={() => setNewDocument(previous => ({ ...previous, accessMode: 'department', allowedUserIds: [] }))} className={`rounded-xl border p-3 text-left text-xs transition ${newDocument.accessMode === 'department' ? 'border-blue-600 bg-white text-blue-900 shadow-sm' : 'border-transparent bg-white/60 text-slate-600'}`}><strong className="block">Um setor</strong><span className="mt-1 block text-[10px]">Apenas uma equipe</span></button><button type="button" onClick={() => setNewDocument(previous => ({ ...previous, accessMode: 'people', dept: 'all' }))} className={`rounded-xl border p-3 text-left text-xs transition ${newDocument.accessMode === 'people' ? 'border-blue-600 bg-white text-blue-900 shadow-sm' : 'border-transparent bg-white/60 text-slate-600'}`}><strong className="block">Pessoas específicas</strong><span className="mt-1 block text-[10px]">Colaboradores escolhidos</span></button></div>{newDocument.accessMode === 'department' && <label className="mt-3 block text-xs font-bold text-slate-700">Setor autorizado<select required value={newDocument.dept} onChange={event => setNewDocument(previous => ({ ...previous, dept: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="all">Selecione o setor</option>{departmentsList.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></label>}{newDocument.accessMode === 'people' && <div className="mt-3"><p className="text-xs font-bold text-slate-700">Colaboradores autorizados</p><div className="mt-2 grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-2">{[...employeesList].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')).map(user => <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50"><input type="checkbox" checked={newDocument.allowedUserIds.includes(user.id)} onChange={event => setNewDocument(previous => ({ ...previous, allowedUserIds: event.target.checked ? [...previous.allowedUserIds, user.id] : previous.allowedUserIds.filter(id => id !== user.id) }))} className="accent-blue-700" /><span className="truncate"><strong>{user.name}</strong>{user.role ? ` · ${user.role}` : ''}</span></label>)}</div><p className="mt-2 text-[10px] text-slate-500">Selecionados: {newDocument.allowedUserIds.length}</p></div>}</div>
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Categoria</label><select value={newDocument.category} onChange={event => setNewDocument(previous => ({ ...previous, category: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:outline-none">{DOCUMENT_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select></div>
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Pasta</label><input value={newDocument.folder} onChange={event => setNewDocument(previous => ({ ...previous, folder: event.target.value }))} maxLength={60} list="document-folder-suggestions" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" placeholder="Ex.: Integração, Formulários, Procedimentos" /><p className="mt-1 text-[10px] text-slate-400">Escolha uma pasta existente ou escreva uma nova. Sem preencher, fica em “Sem pasta”.</p></div>
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Descrição</label><textarea value={newDocument.description} onChange={event => setNewDocument(previous => ({ ...previous, description: event.target.value }))} rows="3" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" placeholder="Explique brevemente o conteúdo do arquivo." /></div>
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Etiquetas</label><input value={newDocument.tags} onChange={event => setNewDocument(previous => ({ ...previous, tags: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" placeholder="Ex.: integração, conduta, 2026" /><p className="mt-1 text-[10px] text-slate-400">Separe as etiquetas por vírgula.</p></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Versão</label><input value={newDocument.version} onChange={event => setNewDocument(previous => ({ ...previous, version: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" placeholder="1.0" /></div><div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Próxima revisão</label><input type="date" value={newDocument.reviewDate} onChange={event => setNewDocument(previous => ({ ...previous, reviewDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none" /></div></div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900"><input type="checkbox" checked={newDocument.requiredRead} onChange={event => setNewDocument(previous => ({ ...previous, requiredRead: event.target.checked }))} className="h-4 w-4 accent-amber-600" /> Exigir confirmação de leitura</label>
              <label className={`flex items-center justify-between rounded-xl border border-dashed px-4 py-3 text-xs font-bold transition ${isUploadingDocument ? 'cursor-wait border-blue-300 bg-blue-50 text-blue-800' : 'cursor-pointer border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}><span className="flex min-w-0 items-center gap-2">{isUploadingDocument ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Upload className="h-4 w-4 shrink-0" />} <span className="truncate">{isUploadingDocument ? `Enviando arquivo… ${documentUploadProgress}%` : newDocument.file?.name || 'Selecionar arquivo'}</span></span><input accept={DOCUMENT_FILE_ACCEPT} disabled={isUploadingDocument || isSavingDocument} type="file" onChange={handleDocumentFile} className="hidden" /></label>
              {isUploadingDocument && <div role="status" aria-live="polite" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-[10px] font-semibold text-blue-900"><div className="flex items-center justify-between gap-3"><span>Enviando para a nuvem. Se a conexão oscilar, o envio continuará automaticamente.</span><button type="button" onClick={() => documentUploadTask.current?.cancel()} className="shrink-0 rounded-lg border border-blue-200 bg-white px-2 py-1 font-bold text-blue-800">Cancelar envio</button></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-700 transition-[width] duration-300" style={{ width: `${documentUploadProgress}%` }} /></div></div>}
              {isSavingDocument && <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] font-semibold text-blue-900"><LoaderCircle className="h-4 w-4 animate-spin text-blue-600" /><span>Publicando e confirmando o documento no Firebase...</span></div>}
              <div className="flex justify-end gap-2"><button type="button" disabled={isUploadingDocument || isSavingDocument} onClick={async () => { if (newDocument.file) await deleteStoredFile(newDocument.file); setNewDocument({ id: '', title: '', description: '', dept: 'all', accessMode: 'company', allowedUserIds: [], category: 'Geral', folder: '', tags: '', version: '1.0', reviewDate: '', requiredRead: false, file: null }); setShowDocumentModal(false); }} className="px-4 py-2 text-xs font-bold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40">Cancelar</button><button type="submit" disabled={!newDocument.file || isUploadingDocument || isSavingDocument} className="inline-flex min-w-[142px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSavingDocument && <LoaderCircle className="h-4 w-4 animate-spin" />}{isSavingDocument ? 'Publicando...' : 'Publicar documento'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLICADOR DE COMUNICADO COM INTEGRAÇÃO DE COPILOTO */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Megaphone className="h-5 w-5 text-slate-300" /> Publicar Comunicado Oficial
              </h3>
              <button type="button" onClick={() => setShowAnnModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitAnnouncement} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título do Comunicado</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novas orientações ou agendamento imperdível"
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                  <select
                    value={newAnn.category}
                    onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="Aviso Geral">Aviso Geral</option>
                    <option value="Regras e Políticas">Regras e Políticas</option>
                    <option value="Confraternização">Confraternização</option>
                    <option value="Aviso Técnico">Aviso Técnico</option>
                    <option value="Emergência">🚨 Emergência — aviso prioritário</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Anexar Capa (Upload de Arquivo)</label>
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    <span>Selecionar imagem...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setNewAnn)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ou cole uma URL direta da internet</label>
                <input
                  type="text"
                  placeholder="Cole um link (Ex: https://images.unsplash.com/photo-...)"
                  value={newAnn.image}
                  onChange={(e) => setNewAnn({ ...newAnn, image: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              {newAnn.image && (
                <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={newAnn.image} className="w-full h-full object-cover" alt="Prévia da Capa" />
                  <button
                    type="button"
                    onClick={() => setNewAnn(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Conteúdo Completo</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Escreva as diretrizes e instruções de forma detalhada..."
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                ></textarea>
                <BotaoEmoji aoSelecionar={(emoji) => setNewAnn(prev => ({ ...prev, content: prev.content + emoji }))} />
                <PreviaEmojis texto={newAnn.content} />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-800 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-slate-500" /> Copiloto AI de Escrita
                  </span>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg text-[9px] font-extrabold py-1 px-1.5 focus:outline-none bg-white"
                    >
                      <option value="profissional">Profissional</option>
                      <option value="empolgante">Empolgante</option>
                      <option value="leve">Leve e Simples</option>
                      <option value="sucinto">Sucinto</option>
                    </select>

                    <button
                      type="button"
                      disabled={isImprovingAnn}
                      onClick={() => handleAICopilot('announcement')}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all"
                    >
                      {isImprovingAnn ? 'Reescrevendo...' : 'Aprimorar Texto ✨'}
                    </button>
                  </div>
                </div>
                {copilotWarning && <span className="text-[9px] text-rose-600 font-bold">{copilotWarning}</span>}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowAnnModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                  Publicar Comunicado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLICADOR DE COMPARTILHAMENTO SETORIAL */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Layers className="h-5 w-5 text-slate-300" /> Publicar Compartilhamento Setorial
              </h3>
              <button type="button" onClick={() => setShowPostModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitSectorPost} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título do Compartilhamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nova conquista do time, manual útil, novidade operacional..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Setor(es) de Destino</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                    {departmentsList
                      .filter(dept => userAllowedDepts.includes(dept.id))
                      .map((dept) => (
                      <label key={dept.id} className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                        <input
                          type="checkbox"
                          checked={(newPost.depts || []).includes(dept.id)}
                          onChange={(e) => {
                            const newDepts = e.target.checked
                              ? [...(newPost.depts || []), dept.id]
                              : (newPost.depts || []).filter(id => id !== dept.id);
                            setNewPost({ ...newPost, depts: newDepts });
                          }}
                          className="rounded text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                  {(!newPost.depts || newPost.depts.length === 0) && (
                    <span className="text-[9px] text-rose-500 font-bold block mt-1">⚠️ Obrigatório selecionar ao menos um setor.</span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Etiquetas / Tags (com vírgula)</label>
                  <input
                    type="text"
                    placeholder="Sucesso, Campanha, Manual"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Anexar Ilustração (Upload)</label>
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <ImageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span>Selecionar imagem...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setNewPost)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ou cole uma URL de imagem</label>
                  <input
                    type="text"
                    placeholder="Cole um link direto da imagem..."
                    value={newPost.image}
                    onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                    className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {newPost.image && (
                <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={newPost.image} className="w-full h-full object-cover" alt="Prévia do Anexo" />
                  <button
                    type="button"
                    onClick={() => setNewPost(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Corpo da Mensagem</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Escreva detalhes técnicos, novidades, boas notícias ou manuais..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="px-3.5 py-2.5 w-full rounded-xl border border-slate-200 text-xs focus:outline-none"
                ></textarea>
                <BotaoEmoji aoSelecionar={(emoji) => setNewPost(prev => ({ ...prev, content: prev.content + emoji }))} />
                <PreviaEmojis texto={newPost.content} />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-800 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-slate-500" /> Copiloto AI de Escrita
                  </span>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg text-[9px] font-extrabold py-1 px-1.5 focus:outline-none bg-white"
                    >
                      <option value="profissional">Profissional</option>
                      <option value="empolgante">Empolgante</option>
                      <option value="leve">Leve e Simples</option>
                      <option value="sucinto">Sucinto</option>
                    </select>

                    <button
                      type="button"
                      disabled={isImprovingPost}
                      onClick={() => handleAICopilot('post')}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all"
                    >
                      {isImprovingPost ? 'Reescrevendo...' : 'Aprimorar Texto ✨'}
                    </button>
                  </div>
                </div>
                {copilotWarning && <span className="text-[9px] text-rose-600 font-bold">{copilotWarning}</span>}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowPostModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                  Postar Novidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMessagesModal && activeTab !== 'inbox' && inboxSurface}

      {showCompanyRegistration && currentUser.isDeveloper && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="company-registration-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Suporte da plataforma</span><h3 id="company-registration-title" className="mt-1 text-base font-extrabold text-slate-800">Cadastrar empresa</h3><p className="mt-1 text-xs text-slate-500">Crie o acesso e o primeiro administrador da nova empresa.</p></div><button type="button" onClick={() => setShowCompanyRegistration(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Fechar cadastro"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleCompanyRegistration} className="flex flex-col gap-3">
              <input required placeholder="Nome da empresa" value={companyForm.name} onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs" />
              <input required placeholder="Código de acesso (ex.: MINHA-EMPRESA)" value={companyForm.code} onChange={(e) => setCompanyForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs uppercase" />
              <input required placeholder="Nome do administrador" value={companyForm.adminName} onChange={(e) => setCompanyForm(prev => ({ ...prev, adminName: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs" />
              <input required type="password" inputMode="numeric" maxLength="4" placeholder="PIN do administrador (4 dígitos)" value={companyForm.adminPin} onChange={(e) => setCompanyForm(prev => ({ ...prev, adminPin: e.target.value.replace(/\D/g, '') }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs" />
              <button type="submit" className="mt-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-slate-800">Criar empresa</button>
            </form>
          </div>
        </div>
      )}

      {activeTutorial && <FeatureTutorial
        tutorialId={activeTutorial}
        userId={currentUser?.id}
        canManage={Boolean(currentUser?.isAdmin || currentUser?.isDeveloper)}
        availableTabs={visibleNavigationSections.flatMap(section => section.items.map(item => item.id)).concat('dashboard')}
        onNavigate={step => {
          if (step.tab) setActiveTab(step.tab);
          if (step.workspace) setServiceWorkspace(step.workspace);
          if (step.activityView) changeServiceActivityView(step.activityView);
          setMobileMenuOpen(step.target === '[data-tour="platform-menu"]' && window.innerWidth < 640);
          if (step.open === 'inbox') setActiveTab('inbox');
          setShowMessagesModal(false);
          const opensControlCenter = step.open === 'permissions' || step.open === 'audit';
          setShowControlCenter(opensControlCenter);
          if (step.open === 'permissions') setControlCenterTab('permissions');
          if (step.open === 'audit') setControlCenterTab('audit');
        }}
        onClose={() => {
          if (activeTutorial === 'services' && servicesTourReleaseKey) {
            try { localStorage.setItem(servicesTourReleaseKey, new Date().toISOString()); } catch { /* dispositivo sem armazenamento local */ }
          }
          setActiveTutorial(null);
          setMobileMenuOpen(false);
          setShowMessagesModal(false);
          setShowControlCenter(false);
        }}
      />}

      {/* RODAPÉ DO SISTEMA */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-850 text-xs text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Comunica. Todos os direitos reservados. Plataforma de comunicação e serviços corporativos. Emojis: <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Twemoji (CC BY 4.0)</a>.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Políticas e Privacidade</span>
            {!currentUser.isDeveloper && <button type="button" onClick={openPlatformSupport} className="hover:text-white transition-colors">Acionar suporte da plataforma</button>}
          </div>
        </div>
      </footer>

    </div>
  );
}


