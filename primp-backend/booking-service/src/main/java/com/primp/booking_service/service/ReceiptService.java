package com.primp.booking_service.service;

import com.primp.booking_service.client.UserClient;
import com.primp.booking_service.model.Booking;
import com.primp.booking_service.repository.BookingRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

/**
 * Service Receipt: "Branded PDF receipt generated after every completed
 * booking — proof of service, payment, and professional identity sent
 * directly to the client." Generated on demand rather than stored, since the
 * booking's price/fee data (the only real dependency) is already persisted.
 */
@Service
public class ReceiptService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");
    private static final float MARGIN = 50;
    private static final float PRIMARY_R = 0.761f;
    private static final float PRIMARY_G = 0.094f;
    private static final float PRIMARY_B = 0.357f;

    private final BookingRepository bookingRepository;
    private final UserClient userClient;

    public ReceiptService(BookingRepository bookingRepository, UserClient userClient) {
        this.bookingRepository = bookingRepository;
        this.userClient = userClient;
    }

    public byte[] generateReceipt(Long bookingId, Long authenticatedUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        boolean isClient = booking.getClientId().equals(authenticatedUserId);
        boolean isProfessional = booking.getProfessionalId().equals(authenticatedUserId);
        if (!isClient && !isProfessional) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        if (booking.getStatus() != Booking.Status.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A receipt is only available once a booking is confirmed and closed");
        }

        String clientName = userClient.getUserName(booking.getClientId());
        String professionalName = userClient.getUserName(booking.getProfessionalId());

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float pageWidth = page.getMediaBox().getWidth();
                float y = page.getMediaBox().getHeight() - MARGIN;

                // Brand header
                content.setNonStrokingColor(PRIMARY_R, PRIMARY_G, PRIMARY_B);
                content.addRect(0, y - 10, pageWidth, 70);
                content.fill();

                content.beginText();
                content.setNonStrokingColor(1f, 1f, 1f);
                content.setFont(PDType1Font.HELVETICA_BOLD, 26);
                content.newLineAtOffset(MARGIN, y + 20);
                content.showText("Primp");
                content.endText();

                content.beginText();
                content.setNonStrokingColor(1f, 1f, 1f);
                content.setFont(PDType1Font.HELVETICA, 11);
                content.newLineAtOffset(MARGIN, y + 2);
                content.showText("Found . Verified . Beautiful");
                content.endText();

                y -= 100;
                content.setNonStrokingColor(0.1f, 0.1f, 0.18f);

                y = writeLine(content, "SERVICE RECEIPT", PDType1Font.HELVETICA_BOLD, 16, y, 20);
                y = writeLine(content, "Booking Reference: #" + booking.getId(), PDType1Font.HELVETICA, 11, y, 18);
                y = writeLine(content, "Issued: " + java.time.LocalDateTime.now().format(DATE_FORMAT), PDType1Font.HELVETICA, 11, y, 25);

                y = writeLine(content, "Client", PDType1Font.HELVETICA_BOLD, 12, y, 16);
                y = writeLine(content, clientName, PDType1Font.HELVETICA, 11, y, 22);

                y = writeLine(content, "Professional", PDType1Font.HELVETICA_BOLD, 12, y, 16);
                y = writeLine(content, professionalName, PDType1Font.HELVETICA, 11, y, 22);

                y = writeLine(content, "Service", PDType1Font.HELVETICA_BOLD, 12, y, 16);
                y = writeLine(content, booking.getServiceType(), PDType1Font.HELVETICA, 11, y, 16);
                y = writeLine(content, "Location: " + safe(booking.getLocation()), PDType1Font.HELVETICA, 11, y, 16);
                if (booking.getPreferredDate() != null) {
                    y = writeLine(content, "Date: " + booking.getPreferredDate().format(DATE_FORMAT), PDType1Font.HELVETICA, 11, y, 25);
                } else {
                    y -= 25;
                }

                // Divider
                content.setStrokingColor(0.85f, 0.85f, 0.85f);
                content.moveTo(MARGIN, y);
                content.lineTo(pageWidth - MARGIN, y);
                content.stroke();
                y -= 25;

                y = writeAmountRow(content, "Service Price", booking.getAgreedPrice(), y, false);
                int feePercent = (int) Math.round((booking.getPrimpFeeRate() != null ? booking.getPrimpFeeRate() : 0.08) * 100);
                y = writeAmountRow(content, "Primp Fee (" + feePercent + "%)", booking.getPrimpFee(), y, false);

                content.setStrokingColor(0.85f, 0.85f, 0.85f);
                content.moveTo(MARGIN, y + 5);
                content.lineTo(pageWidth - MARGIN, y + 5);
                content.stroke();
                y -= 15;

                y = writeAmountRow(content, "Total Paid", booking.getTotalAmount(), y, true);

                y -= 30;
                y = writeLine(content, "Status: CLOSED — Service completed and confirmed by client",
                        PDType1Font.HELVETICA_OBLIQUE, 10, y, 40);

                content.beginText();
                content.setFont(PDType1Font.HELVETICA, 9);
                content.setNonStrokingColor(0.5f, 0.5f, 0.5f);
                content.newLineAtOffset(MARGIN, MARGIN / 2);
                content.showText("This receipt was generated automatically by Primp and reflects a simulated Mobile Money transaction for demo purposes.");
                content.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate receipt");
        }
    }

    private float writeLine(PDPageContentStream content, String text, PDType1Font font, float size, float y, float lineHeight) throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(MARGIN, y);
        content.showText(text);
        content.endText();
        return y - lineHeight;
    }

    private float writeAmountRow(PDPageContentStream content, String label, Double amount, float y, boolean bold) throws IOException {
        double value = amount != null ? amount : 0.0;
        String formatted = String.format("GHS %.2f", value);

        content.beginText();
        content.setFont(bold ? PDType1Font.HELVETICA_BOLD : PDType1Font.HELVETICA, bold ? 13 : 11);
        content.newLineAtOffset(MARGIN, y);
        content.showText(label);
        content.endText();

        content.beginText();
        content.setFont(bold ? PDType1Font.HELVETICA_BOLD : PDType1Font.HELVETICA, bold ? 13 : 11);
        content.newLineAtOffset(400, y);
        content.showText(formatted);
        content.endText();

        return y - (bold ? 22 : 18);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "Not specified" : value;
    }
}