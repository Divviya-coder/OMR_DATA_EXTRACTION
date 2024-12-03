import cv2
import numpy as np
import os

def align_image(reference_path, target_path):
    """
    Align the target image with the reference image.
    :param reference_path: Path to the reference image.
    :param target_path: Path to the target image.
    :return: Aligned image or None if alignment fails.
    """
    # Load reference and target images
    ref_image = cv2.imread(reference_path, 0)
    target_image = cv2.imread(target_path, 0)

    # Detect keypoints and descriptors using SIFT
    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(ref_image, None)
    kp2, des2 = sift.detectAndCompute(target_image, None)

    # Match descriptors using FLANN-based matcher
    index_params = dict(algorithm=1, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(des1, des2, k=2)

    # Filter good matches using Lowe's ratio test
    good_matches = [m for m, n in matches if m.distance < 0.7 * n.distance]

    if len(good_matches) < 10:
        print(f"Not enough matches found for {target_path}. Skipping...")
        return None

    # Extract matched keypoints
    src_points = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_points = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    # Compute homography
    matrix, _ = cv2.findHomography(dst_points, src_points, cv2.RANSAC, 5.0)
    if matrix is None:
        print(f"Homography computation failed for {target_path}. Skipping...")
        return None

    # Align the target image
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

        # Skip non-image files
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

# Example Usage
reference_image_path = "./ref/ref.jpg"  # Path to the reference image
input_folder_path = "./test_images"  # Folder containing images to align
output_folder_path = "./aligned_imagesv2"  # Folder to save aligned images

align_images_in_folder(reference_image_path, input_folder_path, output_folder_path)