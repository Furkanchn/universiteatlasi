package com.universiteatlasi.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.cache.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;

import java.time.Duration;
import java.util.Map;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    @org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
        name = "spring.cache.type", havingValue = "redis")
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(jackson2JsonRedisSerializer())
            )
            .disableCachingNullValues();

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaultConfig)
            // Her cache için farklı TTL tanımlanabilir
            .withInitialCacheConfigurations(Map.of(
                "lisansProgramlari", defaultConfig.entryTtl(Duration.ofMinutes(5)),
                "lisansProgramDetay", defaultConfig.entryTtl(Duration.ofMinutes(30)),
                "universiteler",     defaultConfig.entryTtl(Duration.ofHours(1))
            ))
            .build();
    }

    private Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );
        return new Jackson2JsonRedisSerializer<>(om, Object.class);
    }
}

