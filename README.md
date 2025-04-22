# MCP Weather Server

날씨 정보를 제공하는 MCP 서버입니다. 이 서버는 OpenWeatherMap API를 활용하여 전 세계의 실시간 날씨 정보와 일기예보를 제공합니다.

## 주요 기능

- 🌡️ 현재 날씨 정보 제공 (온도, 습도, 풍속 등)
- 📅 5일간의 일기예보 제공
- 📍 위치 기반 날씨 검색
- 🔍 도시 이름으로 날씨 검색
- ⚡ 빠른 응답 속도와 안정적인 서비스

## 설치 방법

### NPX를 사용한 설치

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "@dbsxortime/mcp-weather-server"],
      "env": {
        "WEATHER_API_KEY": "<YOUR_WEATHER_API_KEY>"
      }
    }
  }
}
```

### 수동 설치

1. 저장소를 클론합니다:

```bash
git clone https://github.com/dbsxortime/mcp-weather-server.git
cd mcp-weather-server
```

2. 의존성을 설치합니다:

```bash
npm install
```

3. 서버를 실행합니다:

```bash
npm start
```

## API 문서

### 현재 날씨 조회

```typescript
GET /weather/current?lat={latitude}&lon={longitude}
```

### 일기예보 조회

```typescript
GET /weather/forecast?lat={latitude}&lon={longitude}
```

## 라이센스

MIT

## 문의

문제가 있거나 문의사항이 있으시면 [이슈](https://github.com/dbsxortime/mcp-weather-server/issues)를 생성해주세요.
