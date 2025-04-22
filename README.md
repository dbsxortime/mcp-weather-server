# MCP Weather Server

날씨 정보를 제공하는 MCP 서버입니다.

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

3. 환경 변수를 설정합니다:

```bash
cp .env.example .env
# .env 파일을 편집하여 WEATHER_API_KEY를 설정합니다
```

4. 서버를 실행합니다:

```bash
npm start
```

## 기능

- 현재 날씨 정보 제공
- 5일간의 일기예보 제공
- 위치 기반 날씨 검색

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
