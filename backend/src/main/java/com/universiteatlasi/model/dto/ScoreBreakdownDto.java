package com.universiteatlasi.model.dto;

import com.universiteatlasi.model.enums.ScoreType;

/**
 * Net -> Puan hesaplama sonucu.
 *
 * @param scoreType     Puan türü (SAY / EA / SOZ / DIL / TYT)
 * @param tytNet        TYT toplam net
 * @param aytNet        AYT toplam net (TYT türünde 0)
 * @param diplomaGrade  Lise diploma notu (0-100); girilmediyse null
 * @param obp           Ortaöğretim Başarı Puanı (diplomaGrade x 5, 0-500)
 * @param hamPuan       Sadece net'lerden hesaplanan ham puan
 * @param obpKatkisi    OBP'nin puana katkısı
 * @param toplamPuan    Ham puan + OBP katkısı
 */
public record ScoreBreakdownDto(
        ScoreType scoreType,
        double    tytNet,
        double    aytNet,
        Double    diplomaGrade,
        double    obp,
        double    hamPuan,
        double    obpKatkisi,
        double    toplamPuan
) {}



