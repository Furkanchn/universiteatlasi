import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url: string = error.config?.url ?? "";
      if (url.includes("/preference/") || url.includes("/members/")) {
        localStorage.removeItem("token");
        localStorage.removeItem("auth-storage");
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/giris?redirect=${redirect}`;
      }
    }
    return Promise.reject(error);
  }
);

export type ScoreType = "SAY" | "EA" | "SOZ" | "DIL" | "TYT";
export type TeachingType = "ORGUNLU" | "IKINDI" | "UZAKTAN";
export type UniversityType = "DEVLET" | "VAKIF" | "VAKIF_UCRETLI";

export type UniversitySummary = {
  id: number;
  name: string;
  city: string | null;
  type: UniversityType | string;
};

export type University = UniversitySummary & {
  region?: string;
  foundingYear?: number | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  studentCount?: number | null;
  facultyCount?: number | null;
  dormCapacity?: number | null;
  dataYear?: number | null;
  bachelorProgramCount?: number | null;
  facultyProgramUnitCount?: number | null;
  totalQuota?: number | null;
  totalPlaced?: number | null;
  occupancyRate?: number | null;
  bestBaseRank?: number | null;
  highestBaseScore?: number | null;
  scoreTypeDistribution?: Record<string, number>;
  teachingTypeDistribution?: Record<string, number>;
};

export type NearbyPlaceCategory = "cafe" | "food" | "dormitory" | "market" | "transport" | "library";

export type NearbyPlace = {
  id?: number;
  name: string;
  category: NearbyPlaceCategory;
  subtype?: string | null;
  lat: number;
  lng: number;
  distanceMeters: number;
  source?: string;
  sourceDate?: string;
  externalId?: string | null;
};

export type UniversityMapData = {
  universityId?: number;
  universityName: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  source: string;
  sourceDate: string;
  confidence?: string;
  places: NearbyPlace[];
};

export type CityCostCategory =
  | "housing"
  | "transport"
  | "electricity"
  | "natural_gas"
  | "food"
  | "general_index"
  | "student_budget"
  | "source_note";

export type CityCostItem = {
  id: number;
  category: CityCostCategory | string;
  label: string;
  amount?: number | null;
  unit?: string | null;
  valueText?: string | null;
  periodLabel: string;
  source: string;
  sourceUrl: string;
  sourceDate: string;
  confidence: string;
  sortOrder?: number | null;
};

export type CityLivingCost = {
  id: number;
  city: string;
  periodLabel: string;
  currency: string;
  sourceSummary: string;
  sourceDate: string;
  confidence: string;
  notes?: string | null;
  items: CityCostItem[];
};

export type MealCostItem = {
  id: number;
  mealType: string;
  label: string;
  amount: number;
  unit: string;
  periodLabel: string;
  source: string;
  sourceUrl: string;
  sourceDate: string;
  confidence: string;
  sortOrder?: number | null;
};

export type UniversityMealCost = {
  universityId: number;
  universityName: string;
  items: MealCostItem[];
};

export type ComparisonMetric = {
  category: string;
  key: string;
  label: string;
  numericValue?: number | null;
  textValue?: string | null;
  unit?: string | null;
  periodLabel: string;
  sourceName: string;
};

export type CityCosts = {
  sehir: string;
  cheapRestaurantMeal?: number | null;
  utilities85m2?: number | null;
  mobilePlan?: number | null;
  internet60mbps?: number | null;
  fitnessMonthly?: number | null;
  cinemaTicket?: number | null;
  rent1brCenter?: number | null;
  rent1brOutside?: number | null;
  rent3brCenter?: number | null;
  rent3brOutside?: number | null;
  avgMonthlySalary?: number | null;
  mortgageRatePct?: number | null;
  isSynthetic?: boolean;
};

export type CityQualityIndex = {
  sehir: string;
  qualityOfLifeIndex?: number | null;
  purchasingPowerIndex?: number | null;
  safetyIndex?: number | null;
  healthCareIndex?: number | null;
  climateIndex?: number | null;
  costOfLivingIndex?: number | null;
  propertyPriceToIncomeRatio?: number | null;
  trafficCommuteTimeIndex?: number | null;
  pollutionIndex?: number | null;
};

export type UniversityComparisonItem = {
  id: number;
  name: string;
  city: string | null;
  type: UniversityType | string;
  studentCount?: number | null;
  facultyCount?: number | null;
  bachelorProgramCount: number;
  totalQuota: number;
  totalPlaced: number;
  occupancyRate?: number | null;
  accreditedProgramCount: number;
  accreditationTextCount: number;
  accreditationLabels: string[];
  campusPlaceCounts: Record<string, number>;
  nearestCampusDistances: Record<string, number>;
  accreditationMetrics: ComparisonMetric[];
  academicMetrics: ComparisonMetric[];
  satisfactionMetrics: ComparisonMetric[];
  cityQuality?: CityQualityIndex | null;
  cityCosts?: CityCosts | null;
};

export type UniversityComparison = {
  items: UniversityComparisonItem[];
};

export type YearData = {
  year: number;
  baseScore: number | null;
  baseRank: number | null;
  ceilingScore: number | null;
  ceilingRank: number | null;
  placed: number | null;
  remaining: number | null;
  yearQuota: number | null;
  registered: number | null;
  additionalPlaced: number | null;
  additionalRegistered: number | null;
};

export type BachelorProgramSummary = {
  id: number;
  programName: string;
  faculty: string;
  scoreType: Exclude<ScoreType, "TYT">;
  teachingType: TeachingType | null;
  quota: number;
  scholarshipRate: number;
  programCode: string | null;
  language: string | null;
  educationDurationYears: number | null;
  detailUrl: string | null;
  programGroupName: string | null;
  unitTypeName: string | null;
  educationTypeName: string | null;
  scholarshipRateName: string | null;
  university: UniversitySummary;
  latestYearData: YearData | null;
};

export type BachelorProgramDetail = Omit<BachelorProgramSummary, "latestYearData"> & {
  tuitionFee: number | null;
  yokatlasUniversityId: number | null;
  yokatlasCityCode: string | null;
  yokatlasProgramGroupId: string | null;
  unitTypeId: number | null;
  educationTypeId: number | null;
  scholarshipRateId: number | null;
  osymGuideId: number | null;
  previousGuideCode: string | null;
  previousUnitId: number | null;
  fymkId: number | null;
  fymkCityName: string | null;
  fymkDistrictName: string | null;
  districtName: string | null;
  accreditation: string | null;
  accreditationDescription: string | null;
  universityAccreditation: string | null;
  conditions: string | null;
  minimumSuccessRank: number | null;
  minimumSuccessRankCondition: string | null;
  quotaY34: number | null;
  quotaDep: number | null;
  quotaMeb: number | null;
  quotaObs: number | null;
  quotaSgy: number | null;
  placementY34: number | null;
  placementDep: number | null;
  placementObs: number | null;
  placementSgy: number | null;
  tyc: string | null;
  appliedEducationModel: string | null;
  femaleCount: number | null;
  maleCount: number | null;
  newGraduateCount: number | null;
  oldGraduateCount: number | null;
  netAverages: Array<Record<string, unknown>>;
  professorCount: number | null;
  associateProfessorCount: number | null;
  doctorFacultyMemberCount: number | null;
  lecturerCount: number | null;
  researchAssistantCount: number | null;
  yearlyData: YearData[];
};

export type PagedResult<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type BachelorFilter = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  universityId?: number;
  universityType?: string;
  scoreType?: string;
  teachingType?: string;
  minQuota?: number;
  maxQuota?: number;
  minRank?: number;
  maxRank?: number;
  minBaseScore?: number;
  maxBaseScore?: number;
  year?: number;
  sort?: string;
};

export type AuthResponse = {
  id: string;
  token: string;
  email: string;
  name?: string;
  expiresAt: number;
};

export type MemberProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatSource = {
  label: string;
  type: string;
  url?: string | null;
};

export type ChatAction = {
  label: string;
  path: string;
};

export type ChatResponse = {
  answer: string;
  sources: ChatSource[];
  suggestedActions: ChatAction[];
  sessionId: string;
};

export type PreferenceMatch = {
  program: BachelorProgramSummary;
  status: "CERTAIN" | "RISKY" | "DIFFICULT" | "UNKNOWN";
  reason: string;
};

export type PreferenceItem = {
  id: string;
  rank: number;
  programId: number;
  programName?: string | null;
  universityName?: string | null;
  city?: string | null;
  scoreType?: string | null;
  baseRank?: number | null;
  baseScore?: number | null;
  type: string;
  notes?: string | null;
};

export type PreferenceList = {
  id: string;
  name: string;
  educationLevel: string;
  enteredScore?: number | null;
  enteredRank?: number | null;
  preferences: PreferenceItem[];
};

export type ScoreBreakdown = {
  scoreType: ScoreType;
  tytNet: number;
  aytNet: number;
  diplomaGrade: number | null;
  obp: number;
  hamPuan: number;
  obpKatkisi: number;
  toplamPuan: number;
};

export const bachelorApi = {
  list: async (filter: BachelorFilter): Promise<PagedResult<BachelorProgramSummary>> => {
    const { data } = await api.get("/bachelor", { params: filter });
    return data;
  },
  programNames: async (): Promise<string[]> => {
    const { data } = await api.get("/bachelor/program-names");
    return data;
  },
  detail: async (id: number): Promise<BachelorProgramDetail> => {
    const { data } = await api.get(`/bachelor/${id}`);
    return data;
  },
  wizard: async (params: { scoreType: string; rank: number; year?: number; city?: string; search?: string }): Promise<PreferenceMatch[]> => {
    const { data } = await api.get("/bachelor/wizard", { params });
    return data;
  },
};

export const universityApi = {
  list: async (filter: { city?: string } = {}): Promise<University[]> => {
    const { data } = await api.get("/university", { params: filter });
    return data;
  },
  detail: async (id: number): Promise<University> => {
    const { data } = await api.get(`/university/${id}`);
    return data;
  },
  map: async (id: number): Promise<UniversityMapData> => {
    const { data } = await api.get(`/university/${id}/map`);
    return data;
  },
  livingCost: async (id: number): Promise<CityLivingCost> => {
    const { data } = await api.get(`/university/${id}/living-cost`);
    return data;
  },
  mealCosts: async (id: number): Promise<UniversityMealCost> => {
    const { data } = await api.get(`/university/${id}/meal-costs`);
    return data;
  },
  compare: async (ids: number[]): Promise<UniversityComparison> => {
    const { data } = await api.get("/university/compare", { params: { ids: ids.join(",") } });
    return data;
  },
  cities: async (): Promise<string[]> => {
    const { data } = await api.get("/university/cities");
    return data;
  },
};

export const scoreApi = {
  calculate: async (params: {
    tytNet: number;
    aytNet: number;
    scoreType: string;
    diplomaGrade?: number;
  }): Promise<ScoreBreakdown> => {
    const { data } = await api.get("/bachelor/calculate-score", { params });
    return data;
  },
};

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/register", { email, password, name });
    return data;
  },
  logout: () => localStorage.removeItem("token"),
};

export const memberApi = {
  me: async (): Promise<MemberProfile> => {
    const { data } = await api.get("/members/me");
    return data;
  },
  updateProfile: async (params: { name: string; email: string }): Promise<MemberProfile> => {
    const { data } = await api.patch("/members/me", params);
    return data;
  },
  changePassword: async (params: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.patch("/members/me/password", params);
  },
};

export const chatApi = {
  send: async (params: {
    message: string;
    sessionId?: string;
    pageContext?: { path: string; title?: string };
  }): Promise<ChatResponse> => {
    const { data } = await api.post("/chat", params);
    return data;
  },
};

export const preferenceApi = {
  getLists: async (): Promise<PreferenceList[]> => {
    const { data } = await api.get("/preference/lists");
    return data;
  },
  createList: async (name: string, enteredRank?: number | null): Promise<PreferenceList> => {
    const { data } = await api.post("/preference/lists", { name, enteredRank });
    return data;
  },
  deleteList: async (listId: string): Promise<void> => {
    await api.delete(`/preference/lists/${listId}`);
  },
  updateListRank: async (listId: string, enteredRank: number | null): Promise<PreferenceList> => {
    const { data } = await api.patch(`/preference/lists/${listId}/rank`, { enteredRank });
    return data;
  },
  addItem: async (listId: string, programId: number): Promise<PreferenceList> => {
    const { data } = await api.post(`/preference/lists/${listId}/items`, { programId });
    return data;
  },
  removeItem: async (listId: string, itemId: string) => {
    await api.delete(`/preference/lists/${listId}/items/${itemId}`);
  },
  updateItem: async (listId: string, itemId: string, params: { notes: string | null }): Promise<PreferenceList> => {
    const { data } = await api.patch(`/preference/lists/${listId}/items/${itemId}`, params);
    return data;
  },
  reorder: async (listId: string, itemIdOrder: string[]): Promise<PreferenceList> => {
    const { data } = await api.patch(`/preference/lists/${listId}/reorder`, itemIdOrder);
    return data;
  },
};

export default api;
