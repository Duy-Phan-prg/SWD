package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.request.food.FoodComboRequest;
import com.sba301.cinemaai.dto.response.food.FoodComboResponse;
import com.sba301.cinemaai.dto.request.food.FoodItemRequest;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.food.FoodItemResponse;
import com.sba301.cinemaai.entity.FoodCombo;
import com.sba301.cinemaai.entity.FoodItem;
import com.sba301.cinemaai.enums.FoodItemStatus;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.FoodMapper;
import com.sba301.cinemaai.repository.FoodComboRepository;
import com.sba301.cinemaai.repository.FoodItemRepository;
import com.sba301.cinemaai.service.FoodService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FoodServiceImpl implements FoodService {

    private final FoodItemRepository foodItemRepository;
    private final FoodComboRepository foodComboRepository;
    private final FoodMapper foodMapper;

    @Transactional(readOnly = true)
    public List<FoodItemResponse> getActiveItems() {
        return foodItemRepository.findByStatus(FoodItemStatus.ACTIVE)
                .stream()
                .map(foodMapper::toFoodItemResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<FoodItemResponse> getActiveItems(int page, int size) {
        return PageResponse.from(foodItemRepository
                .findByStatus(FoodItemStatus.ACTIVE, pageable(page, size))
                .map(foodMapper::toFoodItemResponse));
    }

    @Transactional(readOnly = true)
    public List<FoodComboResponse> getActiveCombos() {
        return foodComboRepository.findByStatus(FoodItemStatus.ACTIVE)
                .stream()
                .map(foodMapper::toFoodComboResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<FoodComboResponse> getActiveCombos(int page, int size) {
        return PageResponse.from(foodComboRepository
                .findByStatus(FoodItemStatus.ACTIVE, pageable(page, size))
                .map(foodMapper::toFoodComboResponse));
    }

    @Transactional(readOnly = true)
    public List<FoodItemResponse> getAllItems() {
        return foodItemRepository.findAll().stream().map(foodMapper::toFoodItemResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<FoodItemResponse> getAllItems(int page, int size) {
        return PageResponse.from(foodItemRepository
                .findAll(pageable(page, size))
                .map(foodMapper::toFoodItemResponse));
    }

    @Transactional(readOnly = true)
    public List<FoodComboResponse> getAllCombos() {
        return foodComboRepository.findAll().stream().map(foodMapper::toFoodComboResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<FoodComboResponse> getAllCombos(int page, int size) {
        return PageResponse.from(foodComboRepository
                .findAll(pageable(page, size))
                .map(foodMapper::toFoodComboResponse));
    }

    @Transactional
    public FoodItemResponse createItem(FoodItemRequest request) {
        FoodItem foodItem = new FoodItem(request.name(), request.description(), request.price());
        applyItemFields(foodItem, request);
        foodItem.setStatus(request.status() == null ? FoodItemStatus.ACTIVE : request.status());
        return foodMapper.toFoodItemResponse(foodItemRepository.save(foodItem));
    }

    @Transactional
    public FoodComboResponse createCombo(FoodComboRequest request) {
        FoodCombo foodCombo = new FoodCombo(request.name(), request.description(), request.price());
        applyComboFields(foodCombo, request);
        foodCombo.setStatus(request.status() == null ? FoodItemStatus.ACTIVE : request.status());
        return foodMapper.toFoodComboResponse(foodComboRepository.save(foodCombo));
    }

    @Transactional
    public FoodItemResponse updateItem(Long id, FoodItemRequest request) {
        FoodItem foodItem = findItem(id);
        applyItemFields(foodItem, request);
        foodItem.setStatus(request.status() == null ? foodItem.getStatus() : request.status());
        return foodMapper.toFoodItemResponse(foodItem);
    }

    @Transactional
    public FoodComboResponse updateCombo(Long id, FoodComboRequest request) {
        FoodCombo foodCombo = findCombo(id);
        applyComboFields(foodCombo, request);
        foodCombo.setStatus(request.status() == null ? foodCombo.getStatus() : request.status());
        return foodMapper.toFoodComboResponse(foodCombo);
    }

    @Transactional
    public FoodItemResponse updateItemStatus(Long id, FoodItemStatus status) {
        FoodItem foodItem = findItem(id);
        foodItem.setStatus(status);
        return foodMapper.toFoodItemResponse(foodItem);
    }

    @Transactional
    public FoodComboResponse updateComboStatus(Long id, FoodItemStatus status) {
        FoodCombo foodCombo = findCombo(id);
        foodCombo.setStatus(status);
        return foodMapper.toFoodComboResponse(foodCombo);
    }

    @Transactional
    public FoodItemResponse deleteItem(Long id) {
        FoodItem foodItem = findItem(id);
        foodItem.setStatus(FoodItemStatus.INACTIVE);
        return foodMapper.toFoodItemResponse(foodItem);
    }

    @Transactional
    public FoodComboResponse deleteCombo(Long id) {
        FoodCombo foodCombo = findCombo(id);
        foodCombo.setStatus(FoodItemStatus.INACTIVE);
        return foodMapper.toFoodComboResponse(foodCombo);
    }

    public FoodItem findItem(Long id) {
        return foodItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Food item not found"));
    }

    public FoodCombo findCombo(Long id) {
        return foodComboRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Food combo not found"));
    }

    private void applyItemFields(FoodItem foodItem, FoodItemRequest request) {
        foodItem.setName(request.name());
        foodItem.setDescription(request.description());
        foodItem.setPrice(request.price());
        foodItem.setImageUrl(request.imageUrl());
        if (request.stockQuantity() != null) {
            foodItem.setStockQuantity(request.stockQuantity());
        }
    }

    private void applyComboFields(FoodCombo foodCombo, FoodComboRequest request) {
        foodCombo.setName(request.name());
        foodCombo.setDescription(request.description());
        foodCombo.setPrice(request.price());
        foodCombo.setImageUrl(request.imageUrl());
        if (request.stockQuantity() != null) {
            foodCombo.setStockQuantity(request.stockQuantity());
        }
    }

    private PageRequest pageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageRequest.of(safePage, safeSize, Sort.by("name").ascending());
    }
}
