package com.universiteatlasi.service;

import com.universiteatlasi.exception.ResourceNotFoundException;
import com.universiteatlasi.model.dto.PreferenceDto.*;
import com.universiteatlasi.model.entity.*;
import com.universiteatlasi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional
public class PreferenceService {

    private final UserRepository            userRepo;
    private final BachelorProgramRepository bachelorRepo;
    private final PreferenceListRepository  preferenceListRepo;
    // Get lists
    @Transactional(readOnly = true)
    public List<PreferenceListDto> getLists(String userId) {
        ensureUserExists(userId);
        return preferenceListRepo.findByUser_IdOrderByCreatedAtDesc(userId).stream()
            .map(this::toListDto)
            .toList();
    }
    // Create new list
    public PreferenceListDto createList(String userId, CreateListRequestDto request) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        PreferenceList list = PreferenceList.builder()
            .user(user)
            .name(normalizeListName(request.name()))
            .educationLevel("LISANS")
            .enteredScore(request.enteredScore())
            .enteredRank(request.enteredRank())
            .build();

        return toListDto(preferenceListRepo.saveAndFlush(list));
    }

    public void deleteList(String userId, String listId) {
        PreferenceList list = getList(userId, listId);
        preferenceListRepo.delete(list);
    }

    public PreferenceListDto updateListRank(String userId, String listId, UpdateListRankRequestDto request) {
        PreferenceList list = getList(userId, listId);
        list.setEnteredRank(request.enteredRank());
        return toListDto(preferenceListRepo.saveAndFlush(list));
    }

    // Add item to list
    public PreferenceListDto addItem(String userId, String listId, AddItemRequestDto request) {
        PreferenceList list = getList(userId, listId);

        validateCanAddItem(list, request.programId());
        PreferenceItem item = newPreferenceItem(list, request);

        list.getPreferences().add(item);
        return toListDto(preferenceListRepo.saveAndFlush(list));
    }
    // Remove item from list
    public void removeItem(String userId, String listId, String itemId) {
        PreferenceList list = getList(userId, listId);
        list.getPreferences().removeIf(i -> i.getId().equals(itemId));
        normalizeRanks(list);
        preferenceListRepo.save(list);
    }

    public PreferenceListDto updateItem(String userId, String listId, String itemId, UpdateItemRequestDto request) {
        PreferenceList list = getList(userId, listId);
        PreferenceItem item = findItem(list, itemId);

        item.setNotes(normalizeNotes(request.notes()));
        return toListDto(preferenceListRepo.saveAndFlush(list));
    }

    // Update order after drag-and-drop
    public PreferenceListDto updateOrder(String userId, String listId, List<String> itemIdOrder) {
        PreferenceList list = getList(userId, listId);
        applyRequestedOrder(list, itemIdOrder);

        return toListDto(preferenceListRepo.saveAndFlush(list));
    }
    // Helpers
    private PreferenceList getList(String userId, String listId) {
        ensureUserExists(userId);
        return preferenceListRepo.findByIdAndUser_Id(listId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Preference list not found: " + listId));
    }

    private void ensureUserExists(String userId) {
        if (!userRepo.existsById(userId)) {
            throw new ResourceNotFoundException("User not found.");
        }
    }

    private String normalizeListName(String name) {
        if (name == null || name.isBlank()) return "Tercih Listem";
        return name.trim();
    }

    private String normalizeNotes(String notes) {
        if (notes == null || notes.isBlank()) return null;
        return notes.trim();
    }

    private void validateCanAddItem(PreferenceList list, Long programId) {
        if (list.getPreferences().size() >= 24) {
            throw new IllegalArgumentException("Maximum 24 preferences allowed.");
        }
        if (list.getPreferences().stream().anyMatch(item -> Objects.equals(item.getBachelorProgramId(), programId))) {
            throw new IllegalArgumentException("Bu program listede zaten var.");
        }
        if (!bachelorRepo.existsById(programId)) {
            throw new ResourceNotFoundException("Bachelor program not found: " + programId);
        }
    }

    private PreferenceItem newPreferenceItem(PreferenceList list, AddItemRequestDto request) {
        return PreferenceItem.builder()
            .list(list)
            .rank(list.getPreferences().size() + 1)
            .bachelorProgramId(request.programId())
            .notes(request.notes())
            .build();
    }

    private void normalizeRanks(PreferenceList list) {
        IntStream.range(0, list.getPreferences().size())
            .forEach(i -> list.getPreferences().get(i).setRank(i + 1));
    }

    private void applyRequestedOrder(PreferenceList list, List<String> itemIdOrder) {
        Map<String, PreferenceItem> itemMap = list.getPreferences().stream()
            .collect(Collectors.toMap(PreferenceItem::getId, i -> i));

        IntStream.range(0, itemIdOrder.size()).forEach(i -> {
            PreferenceItem item = itemMap.get(itemIdOrder.get(i));
            if (item != null) item.setRank(i + 1);
        });
    }

    private PreferenceListDto toListDto(PreferenceList list) {
        Map<Long, BachelorProgram> programs = programMapFor(list);

        List<PreferenceItemDto> items = list.getPreferences().stream()
            .sorted(Comparator.comparingInt(PreferenceItem::getRank))
            .map(item -> toItemDto(item, programs.get(item.getBachelorProgramId())))
            .toList();

        return new PreferenceListDto(
            list.getId(), list.getName(), list.getEducationLevel(),
            list.getEnteredScore(), list.getEnteredRank(), items
        );
    }

    private PreferenceItem findItem(PreferenceList list, String itemId) {
        return list.getPreferences().stream()
            .filter(i -> i.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Preference item not found: " + itemId));
    }

    private Map<Long, BachelorProgram> programMapFor(PreferenceList list) {
        List<Long> programIds = list.getPreferences().stream()
            .map(PreferenceItem::getBachelorProgramId)
            .filter(Objects::nonNull)
            .toList();

        return bachelorRepo.findAllById(programIds).stream()
            .collect(Collectors.toMap(BachelorProgram::getId, program -> program));
    }

    private PreferenceItemDto toItemDto(PreferenceItem item, BachelorProgram program) {
        BachelorYearData yearData = latestYearData(program);
        return new PreferenceItemDto(
            item.getId(), item.getRank(), item.getBachelorProgramId(),
            program == null ? null : program.getProgramName(),
            program == null ? null : program.getUniversity().getName(),
            program == null ? null : program.getUniversity().getCity(),
            program == null ? null : program.getScoreType().name(),
            yearData == null ? null : yearData.getBaseRank(),
            yearData == null ? null : yearData.getBaseScore(),
            "LISANS", item.getNotes()
        );
    }

    private BachelorYearData latestYearData(BachelorProgram program) {
        if (program == null || program.getYearlyData() == null) return null;
        return program.getYearlyData().stream()
            .filter(data -> Objects.equals(data.getYear(), 2025))
            .findFirst()
            .orElse(null);
    }
}


