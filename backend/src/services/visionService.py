#!/usr/bin/env python3
"""
Advanced Python OpenCV Vision Service for NID Card Verification:
1. Automated Card Bounding-Box Detection & Desk Crop (Perspective Warp)
2. Facial Region Detection & eKYC Selfie Matching
"""

import sys
import json
import cv2
import numpy as np

def detect_and_crop_card(image_path, output_path=None):
    """
    Locates the largest rectangular contour corresponding to the NID card
    in an image and warps it to standard 1.586 : 1 (ISO ID-1) perspective.
    """
    image = cv2.imread(image_path)
    if image is None:
        return {"success": False, "error": f"Cannot load image: {image_path}"}

    orig_h, orig_w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Multi-threshold Canny edge detection
    edges = cv2.Canny(blurred, 30, 120)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edges, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    card_contour = None
    max_area = 0

    for c in contours:
        area = cv2.contourArea(c)
        # Look for contours occupying 15% to 95% of image area (avoiding whole frame edge)
        if (orig_w * orig_h * 0.15) < area < (orig_w * orig_h * 0.98):
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.03 * peri, True)
            if len(approx) == 4 and area > max_area:
                card_contour = approx
                max_area = area

    if card_contour is not None:
        pts = card_contour.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]

        target_w, target_h = 800, 504 # Standard 1.586 ratio
        dst = np.array([
            [0, 0],
            [target_w - 1, 0],
            [target_w - 1, target_h - 1],
            [0, target_h - 1]
        ], dtype="float32")

        matrix = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, matrix, (target_w, target_h))

        save_dest = output_path or image_path
        cv2.imwrite(save_dest, warped)

        return {
            "success": True,
            "cardDetected": True,
            "warped": True,
            "outputPath": save_dest,
            "width": target_w,
            "height": target_h
        }
    else:
        return {
            "success": True,
            "cardDetected": False,
            "warped": False,
            "outputPath": image_path,
            "width": orig_w,
            "height": orig_h
        }

def find_primary_face(gray_img):
    """
    Finds face using frontal Haar cascade or falls back to standard card portrait bounding box (left 35% of card).
    """
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    faces = face_cascade.detectMultiScale(gray_img, scaleFactor=1.08, minNeighbors=3, minSize=(35, 35))

    if len(faces) > 0:
        # Return largest detected face
        (x, y, w, h) = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        return gray_img[y:y+h, x:x+w], True

    # Fallback for ID cards: Extract standard Bangladesh NID portrait box (left 8% to 38%, vertical 25% to 80%)
    h, w = gray_img.shape
    px = int(w * 0.08)
    py = int(h * 0.22)
    pw = int(w * 0.32)
    ph = int(h * 0.58)
    return gray_img[py:py+ph, px:px+pw], False

def compare_faces(card_image_path, selfie_image_path):
    """
    Compares card portrait against user's live selfie image.
    Calculates histogram correlation and normalized cross-correlation.
    """
    img_card = cv2.imread(card_image_path)
    img_selfie = cv2.imread(selfie_image_path)

    if img_card is None or img_selfie is None:
        return {"success": False, "error": "One or both image paths are invalid"}

    gray_card = cv2.cvtColor(img_card, cv2.COLOR_BGR2GRAY)
    gray_selfie = cv2.cvtColor(img_selfie, cv2.COLOR_BGR2GRAY)

    card_face, card_found_exact = find_primary_face(gray_card)
    selfie_face, selfie_found_exact = find_primary_face(gray_selfie)

    # Standardize dimensions to 128x128
    crop_card = cv2.resize(card_face, (128, 128))
    crop_selfie = cv2.resize(selfie_face, (128, 128))

    # Equalize illumination histograms
    norm_card = cv2.equalizeHist(crop_card)
    norm_selfie = cv2.equalizeHist(crop_selfie)

    # Histogram Correlation
    hist_card = cv2.calcHist([norm_card], [0], None, [64], [0, 256])
    hist_selfie = cv2.calcHist([norm_selfie], [0], None, [64], [0, 256])
    cv2.normalize(hist_card, hist_card, 0, 1, cv2.NORM_MINMAX)
    cv2.normalize(hist_selfie, hist_selfie, 0, 1, cv2.NORM_MINMAX)
    hist_score = float(cv2.compareHist(hist_card, hist_selfie, cv2.HISTCMP_CORREL))

    # Structural Cross-Correlation
    template_res = cv2.matchTemplate(norm_selfie, norm_card, cv2.TM_CCOEFF_NORMED)
    template_score = float(template_res[0][0])

    # Combined matching score normalized to 0-100%
    combined = max(0.0, (hist_score * 0.40) + (max(0.0, template_score) * 0.60))
    confidence = min(99.0, max(5.0, round(combined * 100, 1)))
    is_match = confidence >= 60.0

    return {
        "success": True,
        "match": is_match,
        "confidenceScore": confidence,
        "cardFaceDetected": card_found_exact,
        "selfieFaceDetected": selfie_found_exact,
        "details": f"Facial correlation match: {confidence}% (Identity authenticated: {is_match})"
    }

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python visionService.py <crop|compare> <arg1> [arg2]"}))
        sys.exit(1)

    action = sys.argv[1]
    if action == 'crop':
        img_path = sys.argv[2]
        out_path = sys.argv[3] if len(sys.argv) > 3 else None
        res = detect_and_crop_card(img_path, out_path)
        print(json.dumps(res))
    elif action == 'compare':
        card_p = sys.argv[2]
        selfie_p = sys.argv[3]
        res = compare_faces(card_p, selfie_p)
        print(json.dumps(res))
    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)
