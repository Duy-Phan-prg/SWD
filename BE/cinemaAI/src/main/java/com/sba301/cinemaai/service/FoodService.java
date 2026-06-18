package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.food.FoodComboRequest;
import com.sba301.cinemaai.dto.response.food.FoodComboResponse;
import com.sba301.cinemaai.dto.request.food.FoodItemRequest;
import com.sba301.cinemaai.dto.response.food.FoodItemResponse;
import com.sba301.cinemaai.entity.FoodCombo;
import com.sba301.cinemaai.entity.FoodItem;
import com.sba301.cinemaai.enums.FoodItemStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.FoodMapper;
import com.sba301.cinemaai.repository.FoodComboRepository;
import com.sba301.cinemaai.repository.FoodItemRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodItemRepository foodItemRepository;
    private final FoodComboRepository foodComboRepository;
    private final FoodMapper foodMapper;

    @Transactional(readOnly = true)
    public List<FoodItemResponse> getActiveItems() {
        return foodItemRepository.findByStatus(FoodItemStatus.ACTIVE)
                .stream()
                .filter(foodItem -> foodItem.getStockQuantity() > 0)
                .map(foodMapper::toFoodItemResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FoodComboResponse> getActiveCombos() {
        return foodComboRepository.findByStatus(FoodItemStatus.ACTIVE)
                .stream()
                .filter(foodCombo -> foodCombo.getStockQuantity() > 0)
                .map(foodMapper::toFoodComboResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FoodItemResponse> getAllItems() {
        return foodItemRepository.findAll().stream().map(foodMapper::toFoodItemResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FoodComboResponse> getAllCombos() {
        return foodComboRepository.findAll().stream().map(foodMapper::toFoodComboResponse).toList();
    }

    @Transactional
    public FoodItemResponse createItem(FoodItemRequest request) {
        FoodItem foodItem = new FoodItem(request.name(), request.description(), request.price());
        foodItem.update(request.name(), request.description(), request.price(), request.imageUrl(), request.stockQuantity());
        foodItem.changeStatus(request.status() == null ? FoodItemStatus.ACTIVE : request.status());
        return foodMapper.toFoodItemResponse(foodItemRepository.save(foodItem));
    }

    @Transactional
    public FoodComboResponse createCombo(FoodComboRequest request) {
        FoodCombo foodCombo = new FoodCombo(request.name(), request.description(), request.price());
        foodCombo.update(request.name(), request.description(), request.price(), request.imageUrl(), request.stockQuantity());
        foodCombo.changeStatus(request.status() == null ? FoodItemStatus.ACTIVE : request.status());
        return foodMapper.toFoodComboResponse(foodComboRepository.save(foodCombo));
    }

    @Transactional
    public FoodItemResponse updateItem(Long id, FoodItemRequest request) {
        FoodItem foodItem = findItem(id);
        foodItem.update(request.name(), request.description(), request.price(), request.imageUrl(), request.stockQuantity());
        foodItem.changeStatus(request.status() == null ? foodItem.getStatus() : request.status());
        return foodMapper.toFoodItemResponse(foodItem);
    }

    @Transactional
    public FoodComboResponse updateCombo(Long id, FoodComboRequest request) {
        FoodCombo foodCombo = findCombo(id);
        foodCombo.update(request.name(), request.description(), request.price(), request.imageUrl(), request.stockQuantity());
        foodCombo.changeStatus(request.status() == null ? foodCombo.getStatus() : request.status());
        return foodMapper.toFoodComboResponse(foodCombo);
    }

    @Transactional
    public FoodItemResponse updateItemStatus(Long id, FoodItemStatus status) {
        FoodItem foodItem = findItem(id);
        foodItem.changeStatus(status);
        return foodMapper.toFoodItemResponse(foodItem);
    }

    @Transactional
    public FoodComboResponse updateComboStatus(Long id, FoodItemStatus status) {
        FoodCombo foodCombo = findCombo(id);
        foodCombo.changeStatus(status);
        return foodMapper.toFoodComboResponse(foodCombo);
    }

    @Transactional
    public void reserveItemStock(Long id, int quantity) {
        FoodItem foodItem = foodItemRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Food item not found"));
        if (foodItem.getStatus() != FoodItemStatus.ACTIVE) {
            throw new BadRequestException("Food item is not available");
        }
        if (foodItem.getStockQuantity() < quantity) {
            throw new BadRequestException("Food item stock is insufficient");
        }
        foodItem.decreaseStock(quantity);
    }

    @Transactional
    public void reserveComboStock(Long id, int quantity) {
        FoodCombo foodCombo = foodComboRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Food combo not found"));
        if (foodCombo.getStatus() != FoodItemStatus.ACTIVE) {
            throw new BadRequestException("Food combo is not available");
        }
        if (foodCombo.getStockQuantity() < quantity) {
            throw new BadRequestException("Food combo stock is insufficient");
        }
        foodCombo.decreaseStock(quantity);
    }

    @Transactional
    public void releaseItemStock(Long id, int quantity) {
        FoodItem foodItem = foodItemRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Food item not found"));
        foodItem.increaseStock(quantity);
    }

    @Transactional
    public void releaseComboStock(Long id, int quantity) {
        FoodCombo foodCombo = foodComboRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Food combo not found"));
        foodCombo.increaseStock(quantity);
    }

    @Transactional
    public FoodItemResponse deleteItem(Long id) {
        FoodItem foodItem = findItem(id);
        foodItem.changeStatus(FoodItemStatus.INACTIVE);
        return foodMapper.toFoodItemResponse(foodItem);
    }

    @Transactional
    public FoodComboResponse deleteCombo(Long id) {
        FoodCombo foodCombo = findCombo(id);
        foodCombo.changeStatus(FoodItemStatus.INACTIVE);
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
}
