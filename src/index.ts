import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

const KMA_API_BASE = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

// package.json 타입 정의
interface PackageJson {
  version: string;
  [key: string]: unknown;
}

// package.json에서 버전 정보 읽기
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
) as PackageJson;

// Zod 스키마 정의
const WeatherArgumentsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  date: z
    .string()
    .regex(/^\d{8}$/, '날짜는 YYYYMMDD 형식이어야 합니다')
    .optional(),
  time: z
    .string()
    .regex(/^\d{4}$/, '시간은 HHMM 형식이어야 합니다')
    .optional(),
});

// API 응답 타입 정의
interface WeatherResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: Array<{
          category: string;
          obsrValue: string;
          baseDate: string;
          baseTime: string;
          nx: number;
          ny: number;
        }>;
      };
    };
  };
}

// 서버 인스턴스 생성
const server = new Server(
  {
    name: 'weather',
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 등록
server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: [
      {
        name: 'get-weather',
        description: '특정 위치의 초단기 실황 날씨 정보를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: '위도 (예: 37.5665)',
            },
            longitude: {
              type: 'number',
              description: '경도 (예: 126.9780)',
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
    ],
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (name === 'get-weather') {
      const { latitude, longitude } = WeatherArgumentsSchema.parse(args);

      // 날짜와 시간이 지정되지 않은 경우 최신 발표 시각 사용
      const { baseDate: latestBaseDate, baseTime: latestBaseTime } = getLatestBaseTime();
      const baseDate = latestBaseDate;
      const baseTime = latestBaseTime;

      // 현재 날씨 데이터 가져오기
      const currentWeatherResponse = await axios.get<WeatherResponse>(
        `${KMA_API_BASE}/getUltraSrtNcst`,
        {
          params: {
            serviceKey: process.env.WEATHER_API_KEY,
            pageNo: 1,
            numOfRows: 1000,
            dataType: 'JSON',
            base_date: baseDate,
            base_time: baseTime,
            nx: Math.round(latitude),
            ny: Math.round(longitude),
          },
        }
      );

      // 초단기예보 데이터 가져오기
      const { baseDate: ultraShortBaseDate, baseTime: ultraShortBaseTime } =
        getUltraShortBaseTime();
      const ultraShortForecastResponse = await axios.get<WeatherResponse>(
        `${KMA_API_BASE}/getUltraSrtFcst`,
        {
          params: {
            serviceKey: process.env.WEATHER_API_KEY,
            pageNo: 1,
            numOfRows: 1000,
            dataType: 'JSON',
            base_date: ultraShortBaseDate,
            base_time: ultraShortBaseTime,
            nx: Math.round(latitude),
            ny: Math.round(longitude),
          },
        }
      );

      // 단기예보 데이터 가져오기 (기온 예보)
      const forecastResponse = await axios.get<WeatherResponse>(`${KMA_API_BASE}/getVilageFcst`, {
        params: {
          serviceKey: process.env.WEATHER_API_KEY,
          pageNo: 1,
          numOfRows: 1000,
          dataType: 'JSON',
          base_date: baseDate,
          base_time: baseTime,
          nx: Math.round(latitude),
          ny: Math.round(longitude),
        },
      });

      if (!currentWeatherResponse.data.response?.body?.items?.item) {
        const errorMessage =
          currentWeatherResponse.data.response?.header?.resultMsg || '알 수 없는 오류';
        throw new Error(`날씨 데이터를 가져오는데 실패했습니다: ${errorMessage}`);
      }

      const weatherData = currentWeatherResponse.data.response.body.items.item;
      const ultraShortForecastData = ultraShortForecastResponse.data.response.body.items.item;
      const forecastData = forecastResponse.data.response.body.items.item;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                current: weatherData,
                ultraShortForecast: ultraShortForecastData,
                forecast: forecastData,
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `잘못된 인수: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
});

// 가장 최신 예보 발표 시각을 반환하는 함수
function getLatestBaseTime(): { baseDate: string; baseTime: string } {
  // 한국 시간으로 설정 (UTC+9)
  const now = new Date();
  const kstOffset = 9 * 60; // 한국 시간 오프셋 (분)
  const utcOffset = now.getTimezoneOffset(); // 현재 시스템의 오프셋 (분)
  now.setMinutes(now.getMinutes() + utcOffset + kstOffset); // UTC -> KST 변환

  const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];

  const currentHourMinute =
    now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
  let baseTime = baseTimes[0];

  // 한국 시간 기준으로 날짜 형식 생성
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  let baseDate = `${year}${month}${day}`;

  // 현재 시간이 02:00보다 이전이면 전날의 마지막 발표 시각(23:00)을 사용
  if (currentHourMinute < '0200') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const yesterdayDay = yesterday.getDate().toString().padStart(2, '0');
    baseDate = `${yesterdayYear}${yesterdayMonth}${yesterdayDay}`;
    baseTime = '2300';
    return { baseDate, baseTime };
  }

  // 현재 시간보다 이전인 가장 최신의 발표 시각 찾기
  for (let i = baseTimes.length - 1; i >= 0; i--) {
    if (currentHourMinute >= baseTimes[i]) {
      baseTime = baseTimes[i];
      break;
    }
  }

  return { baseDate, baseTime };
}

// 초단기예보 발표 시각을 반환하는 함수 (30분 단위)
function getUltraShortBaseTime(): { baseDate: string; baseTime: string } {
  // 한국 시간으로 설정 (UTC+9)
  const now = new Date();
  const kstOffset = 9 * 60; // 한국 시간 오프셋 (분)
  const utcOffset = now.getTimezoneOffset(); // 현재 시스템의 오프셋 (분)
  now.setMinutes(now.getMinutes() + utcOffset + kstOffset); // UTC -> KST 변환

  // 30분 단위로 시간 계산
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  let baseHour = currentHour;

  // 현재 분이 30분 미만이면 이전 30분으로 설정
  if (currentMinute < 30) {
    baseHour = currentHour - 1;
    if (baseHour < 0) {
      baseHour = 23;
      // 날짜도 하루 이전으로 변경
      now.setDate(now.getDate() - 1);
    }
  }

  // 한국 시간 기준으로 날짜 형식 생성
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const baseDate = `${year}${month}${day}`;

  // 30분 단위 시간 생성
  const baseTime = `${baseHour.toString().padStart(2, '0')}30`;

  return { baseDate, baseTime };
}

// 서버 시작
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('날씨 MCP 서버가 stdio에서 실행 중입니다');
}

main().catch((error) => {
  console.error('main()에서 치명적인 오류 발생:', error);
  process.exit(1);
});
