package com.universiteatlasi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableScheduling   // Veri güncelleme cron job'ları için
public class UniversiteAtlasiApplication {

    public static void main(String[] args) {
        SpringApplication.run(UniversiteAtlasiApplication.class, args);
    }
}

