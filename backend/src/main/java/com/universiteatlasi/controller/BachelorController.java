package com.universiteatlasi.controller;

import com.universiteatlasi.model.dto.*;
import com.universiteatlasi.model.dto.ScoreBreakdownDto;
import com.universiteatlasi.model.enums.ScoreType;
import com.universiteatlasi.service.BachelorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bachelor")
@RequiredArgsConstructor
public class BachelorController {

    private final BachelorService bachelorService;

    /**
     * GET /api/bachelor
     * Filtered and paginated bachelor program list.
     *
     * Query params:
     *   search, city, universityId, universityType,
     *   scoreType, teachingType, minQuota, maxQuota,
     *   minRank, maxRank, minBaseScore, maxBaseScore,
     *   year, sort, page, limit
     */
    @GetMapping
    public ResponseEntity<PagedResultDto<BachelorProgramSummaryDto>> list(
            @Valid @ModelAttribute BachelorFilterDto filter) {
        return ResponseEntity.ok(bachelorService.getPrograms(filter));
    }

    /** GET /api/bachelor/program-names - Distinct lisans program names for selector UIs. */
    @GetMapping("/program-names")
    public ResponseEntity<List<String>> programNames() {
        return ResponseEntity.ok(bachelorService.getProgramNames());
    }

    /**
     * GET /api/bachelor/{id}
     * Full details of a single program (with historical year data).
     */
    @GetMapping("/{id}")
    public ResponseEntity<BachelorProgramDetailDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(bachelorService.getProgramDetail(id));
    }

    /**
     * GET /api/bachelor/wizard
     * Matches programs based on user's rank.
     * Results are categorized as Güçlü / Dengeli / Zorlayıcı on the UI.
     *
     * Query params: scoreType (required), rank (required), year (optional), city (optional), search (optional)
     */
    @GetMapping("/wizard")
    public ResponseEntity<List<PreferenceMatchDto>> wizard(
            @RequestParam ScoreType scoreType,
            @RequestParam int rank,
            @RequestParam(defaultValue = "2025") int year,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(bachelorService.wizardMatch(scoreType, rank, year, city, search));
    }

    /**
     * GET /api/bachelor/calculate-score
     * Calculates score from TYT + AYT nets and optionally high school GPA.
     *
     * Query params:
     *   scoreType    - SAY / EA / SOZ / DIL / TYT
     *   tytNet       - TYT toplam net
     *   aytNet       - AYT toplam net (varsayılan 0)
     *   diplomaGrade - Lise diploma notu 0-100 (opsiyonel; girilmezse OBP katkısı eklenmez)
     */
    @GetMapping("/calculate-score")
    public ResponseEntity<ScoreBreakdownDto> calculateScore(
            @RequestParam ScoreType scoreType,
            @RequestParam double tytNet,
            @RequestParam(defaultValue = "0") double aytNet,
            @RequestParam(required = false) Double diplomaGrade) {
        return ResponseEntity.ok(
                bachelorService.calculateScore(scoreType, tytNet, aytNet, diplomaGrade));
    }
}


