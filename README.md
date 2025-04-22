# MCP Weather Server

한국 기상청 API를 활용하여 한국의 날씨 정보를 제공하는 MCP 서버입니다.

## 주요 기능

- 🌡️ 현재 날씨 정보 제공 (온도, 습도, 풍속 등)
- 📅 초단기예보 및 단기예보 제공
- 📍 위치 기반 날씨 검색 (위도/경도)

## AI 입력 파라미터

AI가 날씨 정보를 조회할 때는 다음 파라미터를 입력해야 합니다:

- `latitude`: 위도 (예: 37.5665)
- `longitude`: 경도 (예: 126.9780)

### 데이터 입/출력 예시

```json
// 입력 예시
{
  "latitude": 37.5665123,
  "longitude": 126.9780123
}

// 출력 예시
{
  "current": [...],
  "ultraShortForecast": [...],
  "forecast": [...]
}
```

예시:

```
서울 양천구 날씨 알려줘 => 위도 자동으로 가져와 입력합니다.
```

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

## 라이센스

MIT

## 문의

문제가 있거나 문의사항이 있으시면 [이슈](https://github.com/dbsxortime/mcp-weather-server/issues)를 생성해주세요.
