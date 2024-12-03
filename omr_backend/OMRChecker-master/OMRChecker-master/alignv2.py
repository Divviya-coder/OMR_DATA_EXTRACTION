import cv2
import numpy as np
import os
import argparse

def align_image(reference_path, target_path):
    """
    Align the target image with the reference image.
    :param reference_path: Path to the reference image.
    :param target_path: Path to the target image.
    :return: Aligned image or None if alignment fails.
    """
    ref_image = cv2.imread(reference_path, 0)
    target_image = cv2.imread(target_path, 0)

    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(ref_image, None)
    kp2, des2 = sift.detectAndCompute(target_image, None)

    index_params = dict(algorithm=1, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(des1, des2, k=2)

    good_matches = [m for m, n in matches if m.distance < 0.7 * n.distance]

    if len(good_matches) < 10:
        print(f"Not enough matches found for {target_path}. Skipping...")
        return None

    src_points = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_points = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    matrix, _ = cv2.findHomography(dst_points, src_points, cv2.RANSAC, 5.0)
    if matrix is None:
        print(f"Homography computation failed for {target_path}. Skipping...")
        return None

    h, w = ref_image.shape
    aligned_image = cv2.warpPerspective(cv2.imread(target_path), matrix, (w, h))

    return aligned_image

def align_images_in_folder(reference_path, input_folder, output_folder):
    """
    Align all images in a folder with the reference image and save them to an output folder.
    :param reference_path: Path to the reference image.
    :param input_folder: Folder containing images to align.
    :param output_folder: Folder to save aligned images.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    for filename in os.listdir(input_folder):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, filename)

        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
            print(f"Skipping non-image file: {filename}")
            continue

        print(f"Processing {filename}...")
        aligned_image = align_image(reference_path, input_path)

        if aligned_image is not None:
            cv2.imwrite(output_path, aligned_image)
            print(f"Aligned image saved to {output_path}")
        else:
            print(f"Failed to align {filename}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Align images in a folder to a reference image.")
    parser.add_argument("reference_path", type=str, help="Path to the reference image.")
    parser.add_argument("input_folder", type=str, help="Folder containing images to align.")
    parser.add_argument("output_folder", type=str, help="Folder to save aligned images.")

    args = parser.parse_args()

    align_images_in_folder(args.reference_path, args.input_folder, args.output_folder)