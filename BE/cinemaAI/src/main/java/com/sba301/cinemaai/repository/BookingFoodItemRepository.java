package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.BookingFoodItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingFoodItemRepository extends JpaRepository<BookingFoodItem, Long> {

    List<BookingFoodItem> findByBooking(Booking booking);

    @EntityGraph(attributePaths = {"foodItem", "foodCombo", "foodOrder"})
    List<BookingFoodItem> findByBookingIn(Collection<Booking> bookings);

    // Món mua kèm vé tính theo ngày trả tiền VÉ; món mua THÊM (food order) tính theo
    // ngày thu tiền của chính đơn đó — không lệch kỳ báo cáo
    @org.springframework.data.jpa.repository.Query("""
            SELECT COALESCE(fi.name, fc.name),
                   SUM(f.quantity), SUM(f.quantity * f.unitPrice)
            FROM BookingFoodItem f
            JOIN f.booking b
            LEFT JOIN f.foodItem fi
            LEFT JOIN f.foodCombo fc
            LEFT JOIN f.foodOrder fo
            WHERE b.status IN ('PAID','USED')
              AND (
                (fo IS NULL AND b.paidAt BETWEEN :from AND :to)
                OR (fo.status = 'PAID' AND fo.paidAt BETWEEN :from AND :to)
              )
            GROUP BY COALESCE(fi.name, fc.name)
            ORDER BY SUM(f.quantity) DESC
            """)
    List<Object[]> concessionSales(
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);
}
