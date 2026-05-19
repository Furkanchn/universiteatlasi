package com.universiteatlasi.service;

import com.universiteatlasi.exception.ResourceNotFoundException;
import com.universiteatlasi.model.dto.PreferenceDto.AddItemRequestDto;
import com.universiteatlasi.model.dto.PreferenceDto.UpdateItemRequestDto;
import com.universiteatlasi.model.entity.PreferenceItem;
import com.universiteatlasi.model.entity.PreferenceList;
import com.universiteatlasi.repository.BachelorProgramRepository;
import com.universiteatlasi.repository.PreferenceListRepository;
import com.universiteatlasi.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PreferenceServiceTest {

    private final UserRepository userRepo = mock(UserRepository.class);
    private final BachelorProgramRepository bachelorRepo = mock(BachelorProgramRepository.class);
    private final PreferenceListRepository preferenceListRepo = mock(PreferenceListRepository.class);
    private final PreferenceService service = new PreferenceService(userRepo, bachelorRepo, preferenceListRepo);

    @Test
    void updateItemShouldTrimNotes() {
        PreferenceList list = listWithItem("item-1", "old");
        when(userRepo.existsById("user-1")).thenReturn(true);
        when(preferenceListRepo.findByIdAndUser_Id("list-1", "user-1")).thenReturn(Optional.of(list));
        when(preferenceListRepo.saveAndFlush(any(PreferenceList.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bachelorRepo.findAllById(any())).thenReturn(List.of());

        service.updateItem("user-1", "list-1", "item-1", new UpdateItemRequestDto("  Yeni not  "));

        assertThat(list.getPreferences().get(0).getNotes()).isEqualTo("Yeni not");
    }

    @Test
    void updateItemShouldClearBlankNotes() {
        PreferenceList list = listWithItem("item-1", "old");
        when(userRepo.existsById("user-1")).thenReturn(true);
        when(preferenceListRepo.findByIdAndUser_Id("list-1", "user-1")).thenReturn(Optional.of(list));
        when(preferenceListRepo.saveAndFlush(any(PreferenceList.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bachelorRepo.findAllById(any())).thenReturn(List.of());

        service.updateItem("user-1", "list-1", "item-1", new UpdateItemRequestDto("   "));

        assertThat(list.getPreferences().get(0).getNotes()).isNull();
    }

    @Test
    void updateItemShouldRejectUnknownItem() {
        PreferenceList list = listWithItem("item-1", "old");
        when(userRepo.existsById("user-1")).thenReturn(true);
        when(preferenceListRepo.findByIdAndUser_Id("list-1", "user-1")).thenReturn(Optional.of(list));

        assertThatThrownBy(() -> service.updateItem("user-1", "list-1", "missing", new UpdateItemRequestDto("not")))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Preference item not found");
    }

    @Test
    void addItemShouldRejectFullList() {
        PreferenceList list = listWithItems(24);
        when(userRepo.existsById("user-1")).thenReturn(true);
        when(preferenceListRepo.findByIdAndUser_Id("list-1", "user-1")).thenReturn(Optional.of(list));

        assertThatThrownBy(() -> service.addItem("user-1", "list-1", new AddItemRequestDto(99L, null)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Maximum 24 preferences allowed");
    }

    @Test
    void addItemShouldRejectDuplicateProgram() {
        PreferenceList list = listWithItem("item-1", "old");
        when(userRepo.existsById("user-1")).thenReturn(true);
        when(preferenceListRepo.findByIdAndUser_Id("list-1", "user-1")).thenReturn(Optional.of(list));

        assertThatThrownBy(() -> service.addItem("user-1", "list-1", new AddItemRequestDto(10L, null)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Bu program listede zaten var");
    }

    @Test
    void removeItemShouldNormalizeRanks() {
        PreferenceList list = listWithItems(3);
        when(userRepo.existsById("user-1")).thenReturn(true);
        when(preferenceListRepo.findByIdAndUser_Id("list-1", "user-1")).thenReturn(Optional.of(list));

        service.removeItem("user-1", "list-1", "item-2");

        assertThat(list.getPreferences())
            .extracting(PreferenceItem::getId, PreferenceItem::getRank)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple("item-1", 1),
                org.assertj.core.groups.Tuple.tuple("item-3", 2)
            );
    }

    @Test
    void updateOrderShouldApplyRequestedRanks() {
        PreferenceList list = listWithItems(3);
        when(userRepo.existsById("user-1")).thenReturn(true);
        when(preferenceListRepo.findByIdAndUser_Id("list-1", "user-1")).thenReturn(Optional.of(list));
        when(preferenceListRepo.saveAndFlush(any(PreferenceList.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bachelorRepo.findAllById(any())).thenReturn(List.of());

        service.updateOrder("user-1", "list-1", List.of("item-3", "item-1", "item-2"));

        assertThat(list.getPreferences())
            .extracting(PreferenceItem::getId, PreferenceItem::getRank)
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple("item-1", 2),
                org.assertj.core.groups.Tuple.tuple("item-2", 3),
                org.assertj.core.groups.Tuple.tuple("item-3", 1)
            );
    }

    private PreferenceList listWithItem(String itemId, String notes) {
        PreferenceItem item = PreferenceItem.builder()
            .id(itemId)
            .rank(1)
            .bachelorProgramId(10L)
            .notes(notes)
            .build();

        PreferenceList list = PreferenceList.builder()
            .id("list-1")
            .name("Liste")
            .educationLevel("LISANS")
            .preferences(new ArrayList<>(List.of(item)))
            .build();
        item.setList(list);
        return list;
    }

    private PreferenceList listWithItems(int count) {
        PreferenceList list = PreferenceList.builder()
            .id("list-1")
            .name("Liste")
            .educationLevel("LISANS")
            .preferences(new ArrayList<>())
            .build();

        IntStream.rangeClosed(1, count).forEach(rank -> {
            PreferenceItem item = PreferenceItem.builder()
                .id("item-" + rank)
                .rank(rank)
                .bachelorProgramId((long) rank)
                .build();
            item.setList(list);
            list.getPreferences().add(item);
        });
        return list;
    }
}
