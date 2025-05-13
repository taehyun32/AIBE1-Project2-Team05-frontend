# AIBE1-Project2-Team05-frontend

## WebSequenceDiagrams
### 인증 요청 → 사용자 조회/저장
![OAuth2 인증 플로우](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgT0F1dGgyIOuhnOq3uOyduCAoMeu2gDog7J247KadIOyalOyyrSDihpIg7IKs7Jqp7J6QIOyhsO2ajC_soIDsnqXquYzsp4ApCgpDbGllbnQtPkZpbHRlcjogL29hdXRoMi9hdXRob3JpemF0aW9uL3twcm92aWRlcn0AVQcKACoGAC4KSldUIOykkeuztQCBCwvqsoDsgqwKCmFsdCDsnbTrr7gAgSkK65CcAIETCgogIABJCACBCwY6IC8_ZXJyb3I9YWxyZWFkeV9hdXRoZW50aWNhdGVkIOumrOuLpOydtOugie2KuAplbHNlAFAMmOyngCDslYrsnYAAURUAgjsGU2VydmljZTogbG9hZFVzZXIg7Zi47LacCiAAglsHABoHLT5TdHJhdGVneTogZ2V0AIJ4BlVzZXJJbmZvKHJlZ2lzdHIAgiUFSWQsIGF0dHJpYnV0ZXMpCiAgADIILQBkEQA5DiDrsJjtmZgKAGoSVXNlcgCBIQlzYXZlT3JVcGRhdGUAgSQOABwLAC4GUmVwbzogZmluZEJ5UACDOQdBbmQAAwhJZAoKICBhbHQg6riw7KG0AIMBDQBJBlJlcG8tAHIPACYHAIIpBeqwneyytAAmCQBrE3NhdmUoZXhpc3RpbmdVc2VyKQogIACDKAXsi6DqtwCDdQ4AWxpudWxsAEYhbmV3AFkJbgCBWAUAgSwYAIV-BuuQnACCMAUAgi0PAIQMEQAfD2VuZAo&s=default)


### 토큰 발급 → 리다이렉트
![OAuth2 토큰 플로우](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgT0F1dGgyIOuhnOq3uOyduCAoMuu2gDog7Yag7YGwIOuwnOq4iSDihpIg66as64uk7J2066CJ7Yq46rmM7KeAKQoKADwGU2VydmljZS0tPlN1Y2Nlc3M6IERlZmF1bHQAXAZVc2VyIOqwneyytAoAGwctPkp3dDogZ2VuZXJhdGVBADIFVG9rZW4oYXV0aGVudGljYXRpb24pCkp3dABODOyVoeyEuOyKpACBHQqY7ZmYCgBQClJUOiBjcmVhdGVSZWZyZXNoAEIWUlQtPlVzZXJSZXBvOiBmaW5kQnlQcm92aWRlckFuZAADCElkCgAeCC0AVgYAgUMMUlQtPlJUADcMVXMAOgVVc2VkSXNGYWxzZUFuZEV4cGlyZWRBdEFmdGVyCgAsBgBIB-2ZnOyEsQCCbAmqqeuhnQoKYWx0IE1BWF9UT0tFTlMg7J207IOBCiAgAGUM6rCA7J6lIOyYpOuemOuQnACDMQjsgq3soJwKZW5kCgCBFA1zYXZlKHIAggkLKQB8DuyggOyepeuQnCAAgi0MClJUAINODOumrO2UhOugiOyLAGgJ66y47J6Q7Je0AIJ7CwCEAglKV1Qg7L-g7YKkIOyDneyEsQCBVwbsnoTsi5wg6raM7ZWcIChST0xFX1RFTVApCiAgAIQcCUNsaWVudDog7IKs7Jqp7J6QIOycoO2YlSDshKDtg50g7Y6Y7J207KeA66GcAIUVEAplbHNlIOydvOuwmAA2CwBrBgBRFOuplOyduAA1H25kCg&s=default)

## Mermaid
### 인증 요청 → 사용자 조회/저장
```mermaid
---
config:
  theme: neutral 
---
sequenceDiagram
  participant Client as 클라이언트
  participant Filter as PreventDuplicateLoginFilter
  participant OAuth2Service as CustomOAuth2UserService
  participant Strategy as OAuth2UserInfoFactory
  participant UserService as UserServiceImpl
  participant UserRepo as UserRepository

  Client ->> Filter: /oauth2/authorization/{provider} 요청
  Filter ->> Filter: JWT 중복 로그인 검사

  alt 이미 로그인된 사용자
    Filter -->> Client: /?error=already_authenticated 리다이렉트
  else 로그인되지 않은 사용자
    Filter ->>+ OAuth2Service: loadUser 호출
    OAuth2Service ->> Strategy: getOAuth2UserInfo(registrationId, attributes)
    Strategy -->> OAuth2Service: OAuth2UserInfo 반환

    OAuth2Service ->> UserService: saveOrUpdateUser 호출
    UserService ->> UserRepo: findByProviderAndProviderId

    alt 기존 사용자
      UserRepo -->> UserService: 기존 User 객체
      UserService ->> UserRepo: save(existingUser)
    else 신규 사용자
      UserRepo -->> UserService: null
      UserService ->> UserRepo: save(newUser)
    end

    UserRepo -->> UserService: 저장된 User
    UserService -->> OAuth2Service: 저장된 User
  end
```

### 토큰 발급 → 리다이렉트
```mermaid
---
config:
  theme: neutral 
---
sequenceDiagram
  participant OAuth2Service as CustomOAuth2UserService
  participant Success as OAuth2AuthenticationSuccessHandler
  participant Jwt as JwtServiceImpl
  participant RT as RefreshTokenServiceImpl
  participant UserRepo as UserRepository
  participant RTRepo as RefreshTokenRepository
  participant Client as 클라이언트

  OAuth2Service -->> Success: DefaultOAuth2User 객체
  Success ->>+ Jwt: generateAccessToken(authentication)
  Jwt -->>- Success: 액세스 토큰 반환

  Success ->>+ RT: createRefreshToken(authentication)
  RT ->> UserRepo: findByProviderAndProviderId
  UserRepo -->> RT: User 객체
  RT ->> RTRepo: findByUserAndUsedIsFalseAndExpiredAtAfter
  RTRepo -->> RT: 활성 토큰 목록

  alt MAX_TOKENS 이상
    RT ->> RTRepo: 가장 오래된 토큰 삭제
  end

  RT ->> RTRepo: save(refreshToken)
  RTRepo -->> RT: 저장된 RefreshToken
  RT -->>- Success: 리프레시 토큰 문자열

  Success ->> Success: JWT 쿠키 생성

  alt 임시 권한 (ROLE_TEMP)
    Success -->> Client: 사용자 유형 선택 페이지로 리다이렉트
  else 일반 사용자 권한
    Success -->> Client: 메인 페이지로 리다이렉트
  end

```

## 풀버전
```mermaid
---
config:
  theme: neutral 
---
sequenceDiagram
  participant Client as 클라이언트
  participant Filter as PreventDuplicateLoginFilter
  participant Success as OAuth2AuthenticationSuccessHandler
  participant OAuth2Service as CustomOAuth2UserService
  participant Strategy as OAuth2UserInfoFactory
  participant UserService as UserServiceImpl
  participant Jwt as JwtServiceImpl
  participant RT as RefreshTokenServiceImpl
  participant UserRepo as UserRepository
  participant RTRepo as RefreshTokenRepository
  Client ->> Filter: /oauth2/authorization/{provider} 요청
  Filter ->> Filter: JWT 중복 로그인 검사
  alt 이미 로그인된 사용자
    Filter -->> Client: /?error=already_authenticated 리다이렉트
  else 로그인되지 않은 사용자
    Strategy ->> Strategy: new msg
    Strategy ->> Strategy: new msg
    Filter ->>+ OAuth2Service: loadUser 호출
    OAuth2Service ->> Strategy: getOAuth2UserInfo(registrationId, attributes)
    Strategy -->> OAuth2Service: OAuth2UserInfo 반환
    OAuth2Service ->> UserService: saveOrUpdateUser 호출
    UserService ->> UserRepo: findByProviderAndProviderId
    alt 기존 사용자
      UserRepo -->> UserService: 기존 User 객체
      UserService ->> UserRepo: save(existingUser)
    else 신규 사용자
      UserRepo -->> UserService: null
      UserService ->> UserRepo: save(newUser)
    end
    UserRepo -->> UserService: 저장된 User
    OAuth2Service ->> OAuth2Service: new msg
    UserService -->> OAuth2Service: 저장된 User
    OAuth2Service -->>- Success: DefaultOAuth2User 객체
    Success ->>+ Jwt: generateAccessToken(authentication)
    Jwt ->> Jwt: providerId, 권한 추출
    Jwt -->>- Success: 액세스 토큰 반환
    Success ->>+ RT: createRefreshToken(authentication)
    RT ->> RT: providerId 추출
    RT ->> UserRepo: findByProviderAndProviderId
    UserRepo -->> RT: User 객체
    RT ->> RT: UUID 생성
    RT ->> RTRepo: findByUserAndUsedIsFalseAndExpiredAtAfter
    RTRepo -->> RT: 활성 토큰 목록
    alt MAX_TOKENS 이상
      RT ->> RTRepo: 가장 오래된 토큰 삭제
    end
    RT ->> RTRepo: save(refreshToken)
    RTRepo -->> RT: 저장된 RefreshToken
    RT -->>- Success: 리프레시 토큰 문자열
    Success ->> Success: JWT 쿠키 생성
    alt 임시 권한 (ROLE_TEMP)
      Success -->> Client: 사용자 유형 선택 페이지로 리다이렉트
    else 일반 사용자 권한
      Success -->> Client: 메인 페이지로 리다이렉트
    end
  end
```
