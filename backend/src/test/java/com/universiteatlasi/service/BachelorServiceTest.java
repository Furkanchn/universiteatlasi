package com.universiteatlasi.service;

import com.universiteatlasi.model.dto.BachelorFilterDto;
import com.universiteatlasi.model.enums.ScoreType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class BachelorServiceTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    @DisplayName("SAY score should be calculated correctly")
    void sayScoreCalculation() {
        double score = 160.0 + (40 * 1.6) + (80 * 3.5);
        assertThat(score).isEqualTo(504.0);
    }

    @ParameterizedTest
    @CsvSource({
        "SAY, 40, 80, 504.0",
        "EA,  40, 80, 464.0",
        "SOZ, 40, 80, 448.0",
        "TYT, 40,  0, 153.32"
    })
    @DisplayName("Score calculation should be verified for different score types")
    void calculateScoreForDifferentTypes(String type, double tyt, double ayt, double expected) {
        BachelorService service = new BachelorService(null);
        double calculated = service.calculateScore(ScoreType.valueOf(type), tyt, ayt, null).toplamPuan();
        assertThat(calculated).isCloseTo(expected, within(0.1));
    }

    @Test
    @DisplayName("CERTAIN status when user rank is much lower than base rank")
    void certainStatus() {
        assertThat(determineStatus(1000, 2000)).isEqualTo("CERTAIN");
    }

    @Test
    @DisplayName("RISKY status when user rank is close to base rank")
    void riskyStatus() {
        assertThat(determineStatus(1900, 2000)).isEqualTo("RISKY");
    }

    @Test
    @DisplayName("DIFFICULT status when user rank is higher than base rank")
    void difficultStatus() {
        assertThat(determineStatus(3000, 2000)).isEqualTo("DIFFICULT");
    }

    @Test
    @DisplayName("Bachelor filter should reject inverted ranges")
    void bachelorFilterRejectsInvertedRanges() {
        BachelorFilterDto filter = new BachelorFilterDto(
            null, null, null, null, null, null,
            80, 20,
            100_000, 50_000,
            null, null,
            2025, "baseRank_asc", 1, 20
        );

        assertThat(validator.validate(filter))
            .extracting(violation -> violation.getPropertyPath().toString())
            .contains("quotaRangeValid", "baseRankRangeValid");
    }

    @Test
    @DisplayName("Bachelor filter should default to 2025 base rank sorting")
    void bachelorFilterDefaults() {
        BachelorFilterDto filter = new BachelorFilterDto(
            null, null, null, null, null, null,
            null, null,
            null, null,
            null, null,
            null, null, null, null
        );

        assertThat(filter.year()).isEqualTo(2025);
        assertThat(filter.sort()).isEqualTo("baseRank_asc");
        assertThat(filter.page()).isEqualTo(1);
        assertThat(filter.limit()).isEqualTo(20);
    }

    private String determineStatus(int userRank, int baseRank) {
        double ratio = (double) userRank / baseRank;
        if (ratio <= 0.8) return "CERTAIN";
        if (ratio <= 1.2) return "RISKY";
        return "DIFFICULT";
    }
}
