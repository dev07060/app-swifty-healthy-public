# 운동 분석 거리 표시 업데이트 요약

## 개요
운동 이미지 분석에서 신뢰도 대신 운동거리(km)를 표시하도록 수정했습니다. 걷기, 달리기, 사이클링 등의 운동에서만 거리가 표시되며, 해당 정보가 없으면 표시되지 않습니다.

## 주요 변경사항

### 1. 타입 정의 수정 (`src/types/index.ts`)
- **ExerciseEntry**: `distance?: number` 필드 추가
- **GeminiExerciseResponse**: `confidence: number` 제거, `distance?: number` 추가
- **GeminiFoodResponse**: `confidence: number` 제거

### 2. API 클라이언트 수정 (`src/services/GeminiAPIClient.ts`)
- **운동 분석 프롬프트**: 거리 추출 로직 추가, 신뢰도 제거
- **음식 분석 프롬프트**: 신뢰도 제거
- **응답 파싱**: 거리 필드 유효성 검사 추가, 신뢰도 검사 제거

### 3. UI 표시 로직 수정 (`src/utils/analysisDataMapper.ts`)
- **EXERCISE_DISPLAY_CONFIG**: 신뢰도 항목 제거, 거리 항목 추가
- **거리 포맷터**: `${value}km` 형식으로 표시
- **거리 유효성 검사**: 소수점 1자리까지 허용
- **신뢰도 관련 로직**: 완전 제거

### 4. Enhanced Analysis 화면 수정 (`src/pages/enhanced-analysis/EnhancedAnalysisScreen.tsx`)
- **저장 로직**: 거리 필드 포함하여 저장
- **편집 로직**: 거리 필드 편집 지원 (소수점 허용)

## 새로운 기능

### 거리 표시 규칙
1. **표시 조건**: 걷기, 달리기, 사이클링, 등산 등의 운동에서만 표시
2. **Null Safety**: 거리 정보가 없으면 표시되지 않음
3. **단위**: km 단위로 표시
4. **정밀도**: 소수점 1자리까지 지원 (예: 5.2km)

### AI 분석 개선
- **스마트 거리 추출**: 운동 종류에 따라 거리 정보 추출 여부 결정
- **정확한 프롬프트**: 거리가 필요한 운동과 그렇지 않은 운동 구분
- **Null 처리**: 거리 정보가 없는 경우 null로 설정

## 사용자 경험 개선

### Before (이전)
```
운동 종류: 달리기
운동 시간: 30분
소모 칼로리: 300kcal
신뢰도: 85%  ← 불필요한 정보
```

### After (현재)
```
운동 종류: 달리기
운동 시간: 30분
소모 칼로리: 300kcal
운동 거리: 5.2km  ← 유용한 정보 (거리가 있는 경우만)
```

## 기술적 세부사항

### 거리 필드 처리
- **타입**: `number | undefined` (선택적 필드)
- **유효성 검사**: 0 이상의 숫자, 소수점 1자리까지
- **저장**: ExerciseEntry에 distance 필드로 저장
- **편집**: 실시간 편집 지원

### API 응답 처리
- **필수 필드**: exerciseType, duration, calories, date
- **선택적 필드**: distance (null 또는 number)
- **에러 처리**: 거리 필드 타입 검증 추가

### UI 우선순위
1. 운동 종류 (priority: 10)
2. 운동 시간 (priority: 9)
3. 소모 칼로리 (priority: 8)
4. 운동 거리 (priority: 7) - 있는 경우만 표시

## 테스트 결과
- ✅ 빌드 성공
- ✅ 모든 테스트 통과 (42/42)
- ✅ 타입 안전성 확보
- ✅ Null safety 구현

## 호환성
- **기존 데이터**: 거리 필드가 없는 기존 운동 데이터와 호환
- **API**: 기존 API 응답 구조와 호환 (거리는 선택적 필드)
- **UI**: 거리 정보가 없어도 정상 동작