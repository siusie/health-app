// client/components/ProfilePicture/ProfilePictureManager.jsx
import React, { useState, useRef, useEffect } from "react";
import { Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import styles from "./ProfilePictureManager.module.css";
import Image from "next/image";
/**
 * Unified Profile Picture Manager Component
 * Handles display, upload, cropping, and removal of profile pictures
 *
 * @param {Object} props
 * @param {string} props.entityType - 'user' or 'baby'
 * @param {string|number} props.entityId - The ID of the entity
 * @param {string} props.currentImageUrl - Current profile picture URL
 * @param {function} props.onImageUpdate - Callback when image is updated
 * @param {number} props.size - Size of the profile picture display
 * @param {boolean} props.readOnly - If true, only displays the image without edit options
 */
const ProfilePictureManager = ({
  entityType,
  entityId,
  currentImageUrl,
  onImageUpdate,
  size = 100,
  readOnly = false,
}) => {
  const { t } = useTranslation("common");
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({
    unit: "px",
    width: 200,
    height: 200,
    aspect: 1,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Refs
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Determine if current image is a default image
  const isDefaultImage =
    !currentImageUrl ||
    currentImageUrl.includes("BlankProfilePicture") ||
    currentImageUrl.includes("BlankBabyPicture");

  // Get proper image URL
  const getImageUrl = () => {
    if (!currentImageUrl) {
      return getDefaultImagePath();
    }

    // If it's a default image path, use it as is
    if (
      currentImageUrl.includes("BlankProfilePicture") ||
      currentImageUrl.includes("BlankBabyPicture")
    ) {
      return currentImageUrl;
    }

    // If it's already a full URL, use it as is
    if (currentImageUrl.startsWith("http")) {
      return currentImageUrl;
    }

    // If it's an API path that starts with /v1/, prepend the API URL
    if (currentImageUrl.startsWith("/v1/")) {
      const separator = currentImageUrl.includes("?") ? "&" : "?";
      const cacheBuster = `${separator}t=${Date.now()}`;
      return `${process.env.NEXT_PUBLIC_API_URL}${currentImageUrl}${cacheBuster}`;
    }

    // Otherwise just add cache busting
    return `${currentImageUrl}?t=${Date.now()}`;
  };

  // Get default image path based on entity type
  const getDefaultImagePath = () => {
    return entityType === "baby"
      ? "/BlankProfilePictures/BlankBabyPicture.png"
      : "/BlankProfilePictures/BlankProfilePicture.avif";
  };

  // Modal handlers
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCrop({
      unit: "px",
      width: 200,
      height: 200,
      aspect: 1,
    });
    setCompletedCrop(null);
    setError(null);
    setSuccess(null);
  };

  const handleModalShow = () => {
    setShowModal(true);
  };

  // File selection handler
  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];

    if (!file) return;

    setFileLoading(true);

    // Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(t("File size exceeds 5MB limit."));
      setFileLoading(false);
      return;
    }

    // Check file type
    const validExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".avif",
      ".bmp",
    ];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext),
    );

    if (!hasValidExtension) {
      setError(t("Please select an image file (JPG, PNG, GIF, WebP, etc.)"));
      setFileLoading(false);
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);

      // Pre-load the image to get dimensions for auto-centering
      const img = new window.Image();
      img.onload = () => {
        // Only proceed if the image has loaded properly
        if (img.width > 0 && img.height > 0) {
          // Set initial crop to center of image
          const size = Math.min(img.width, img.height, 300);
          const initialCrop = {
            unit: "px",
            width: size,
            height: size,
            x: Math.max(0, (img.width - size) / 2),
            y: Math.max(0, (img.height - size) / 2),
            aspect: 1,
          };

          setCrop(initialCrop);
          setCompletedCrop(initialCrop);
        }
        setFileLoading(false);
      };
      img.onerror = () => {
        setError(t("Cannot load image. File may be corrupted."));
        setFileLoading(false);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Image load handler for ReactCrop
  const onImageLoaded = (img) => {
    imgRef.current = img;

    if (img && img.width && img.height) {
      // Center the crop in the middle of the image
      const size = Math.min(img.width, img.height, 300);
      const initialCrop = {
        unit: "px",
        width: size,
        height: size,
        x: Math.max(0, (img.width - size) / 2),
        y: Math.max(0, (img.height - size) / 2),
        aspect: 1,
      };
      // Small delay to ensure the crop is properly set
      setTimeout(() => {
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
      }, 50);
    }

    return false;
  };

  const centerCrop = () => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    const size = Math.min(img.width, img.height, 300);

    const centerX = Math.max(0, (img.width - size) / 2);
    const centerY = Math.max(0, (img.height - size) / 2);

    const newCrop = ensureCropInBounds(
      {
        unit: "px",
        width: size,
        height: size,
        x: centerX,
        y: centerY,
        aspect: 1,
      },
      img.width,
      img.height,
    );

    setCrop(newCrop);
    setCompletedCrop(newCrop);
  };

  // Improved function to ensure crop stays within image boundaries
  const ensureCropInBounds = (crop, imageWidth, imageHeight) => {
    if (!crop || !imageWidth || !imageHeight) return crop;

    const newCrop = { ...crop };

    // First, ensure crop dimensions don't exceed image dimensions
    newCrop.width = Math.min(newCrop.width, imageWidth);
    newCrop.height = Math.min(newCrop.height, imageHeight);

    // Next, ensure x and y aren't negative (left and top boundaries)
    newCrop.x = Math.max(0, newCrop.x);
    newCrop.y = Math.max(0, newCrop.y);

    // Finally, ensure crop doesn't exceed right and bottom boundaries
    if (newCrop.x + newCrop.width > imageWidth) {
      // Two options: either adjust x or adjust width
      // For better UX, we prioritize maintaining the selected size when possible
      newCrop.x = Math.max(0, imageWidth - newCrop.width);
    }

    if (newCrop.y + newCrop.height > imageHeight) {
      newCrop.y = Math.max(0, imageHeight - newCrop.height);
    }

    return newCrop;
  };

  // Update preview canvas when crop changes
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return;

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const ctx = canvas.getContext("2d");

    // Set correct canvas dimensions
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(crop.width / 2, crop.height / 2, crop.width / 2, 0, 2 * Math.PI);
    ctx.clip();

    // Draw the selected portion
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );
  }, [completedCrop]);

  // Generate cropped image for upload
  const generateCroppedImage = async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return null;
    }

    // Special handling for GIFs (server will handle cropping)
    if (selectedFile.type === "image/gif") {
      return selectedFile;
    }

    // For other image types, create crop using canvas
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(
      completedCrop.width / 2,
      completedCrop.height / 2,
      completedCrop.width / 2,
      0,
      2 * Math.PI,
    );
    ctx.clip();

    // Draw the selected portion
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    // Determine output format
    let outputFormat = selectedFile.type || "image/png";

    // Use WebP for better compression when supported
    if (outputFormat === "image/jpeg" || outputFormat === "image/png") {
      outputFormat = "image/webp";
    }

    // Create Blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Canvas is empty or toBlob failed");
            return null;
          }
          resolve(blob);
        },
        outputFormat,
        outputFormat === "image/jpeg" ? 0.92 : undefined,
      );
    });
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile || !completedCrop) {
      setError(t("Please select and crop an image first."));
      return;
    }

    if (!entityId) {
      setError(t("Missing entity ID. Unable to upload image."));
      console.error("Missing entityId in ProfilePictureManager:", {
        entityType,
        entityId,
      });
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Get the cropped image blob
      const uploadBlob = await generateCroppedImage();

      if (!uploadBlob) {
        throw new Error(t("Failed to process image."));
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append("profilePicture", uploadBlob, selectedFile.name);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId.toString());

      // Upload the image
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/profile-picture/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `Upload failed (${response.status})`,
        );
      }

      const responseData = await response.json();

      // Display success message
      setSuccess({
        message: t("Profile picture updated successfully"),
      });

      // Process the URL properly before passing it to parent
      let profileUrl = responseData.profileUrl;
      if (profileUrl && profileUrl.startsWith("/v1/")) {
        profileUrl = `${process.env.NEXT_PUBLIC_API_URL}${profileUrl}`;
      }

      // Update parent component
      if (onImageUpdate) {
        onImageUpdate(profileUrl);
      }

      // Auto-close modal after success
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    } catch (err) {
      console.error("Error during image upload:", err);
      setError(err.message || t("An error occurred during upload."));
    } finally {
      setUploading(false);
    }
  };

  // Handle image removal
  const handleRemoveImage = async () => {
    if (
      !window.confirm(
        t("Are you sure you want to remove this profile picture?"),
      )
    ) {
      return;
    }

    try {
      setUploading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/profile-picture/${entityType}/${entityId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || t("Failed to remove profile picture."),
        );
      }

      const data = await response.json();

      // Use the default image URL as is without API URL prefix
      // since these are likely served directly from the static folder
      let defaultUrl = data.defaultImageUrl;

      // Update parent component
      if (onImageUpdate) {
        onImageUpdate(defaultUrl);
      }

      // Close modal
      handleModalClose();
    } catch (err) {
      setError(err.message || t("An error occurred while removing the image."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.profilePictureManager}>
      {/* Current Profile Picture */}
      <div
        className={styles.imageContainer}
        style={{ width: size, height: size }}
      >
        <img
          src={getImageUrl()}
          alt={t("Profile Picture")}
          className={styles.profileImage}
          width={size}
          height={size}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getDefaultImagePath();
          }}
        />
      </div>

      {/* Upload and Remove Buttons - only shown if not readOnly */}
      {!readOnly && (
        <div className={styles.buttonContainer}>
          <Button
            variant="primary"
            className={styles.uploadButton}
            onClick={handleModalShow}
          >
            {t("Change Photo")}
          </Button>

          {!isDefaultImage && (
            <Button
              variant="outline-danger"
              className={styles.removeButton}
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              {uploading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                t("Remove")
              )}
            </Button>
          )}
        </div>
      )}

      {/* Upload Modal with improved styles */}
      <Modal
        show={showModal}
        onHide={handleModalClose}
        centered
        backdrop={true}
        className={styles.modalWrapper}
      >
        <Modal.Header closeButton className="bg-white">
          <Modal.Title>{t("Upload Profile Picture")}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          {error && <Alert variant="danger">{error}</Alert>}

          {success && <Alert variant="success">{success.message}</Alert>}

          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>{t("Select an image")}</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              ref={fileInputRef}
              disabled={fileLoading || uploading}
            />
            <Form.Text className="text-muted">
              {t("Maximum size: 5MB. Supports JPG, PNG, GIF, WebP, and more.")}
            </Form.Text>
          </Form.Group>

          {previewUrl && (
            <>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={centerCrop}
                className="mt-1 mb-3"
                disabled={fileLoading}
              >
                {t("Center on Face")}
              </Button>

              <div className={styles.cropContainer}>
                {fileLoading && (
                  <div className="d-flex justify-content-center align-items-center py-4">
                    <Spinner animation="border" />
                    <span className="ms-2">{t("Processing image...")}</span>
                  </div>
                )}

                {!fileLoading && (
                  <ReactCrop
                    src={previewUrl}
                    crop={crop}
                    onChange={(newCrop) => {
                      const boundedCrop = ensureCropInBounds(
                        newCrop,
                        imgRef.current?.width,
                        imgRef.current?.height,
                      );
                      setCrop(boundedCrop);
                    }}
                    onComplete={(c) => {
                      const boundedCrop = ensureCropInBounds(
                        c,
                        imgRef.current?.width,
                        imgRef.current?.height,
                      );
                      setCompletedCrop(boundedCrop);
                    }}
                    aspect={1}
                    circularCrop
                    keepSelection={true}
                    minWidth={50}
                    minHeight={50}
                  >
                    <img
                      ref={imgRef}
                      alt={t("Crop preview")}
                      src={previewUrl}
                      style={{ maxWidth: "100%", maxHeight: "500px" }}
                      onLoad={(e) => {
                        imgRef.current = e.currentTarget;
                        onImageLoaded(e.currentTarget);
                      }}
                    />
                  </ReactCrop>
                )}

                {/* Preview */}
                {completedCrop && !fileLoading && (
                  <div className={styles.previewSection}>
                    <p className="mt-3 mb-1">{t("Preview")}</p>
                    <div className={styles.previewCircle}>
                      {selectedFile && selectedFile.type === "image/gif" ? (
                        <img
                          src={previewUrl}
                          className={styles.previewGif}
                          style={{
                            position: "absolute",
                            top: -completedCrop.y,
                            left: -completedCrop.x,
                            width: imgRef.current?.width || "auto",
                            height: imgRef.current?.height || "auto",
                            maxWidth: "none",
                            clipPath: "circle(40px at center)",
                          }}
                          alt={t("Preview")}
                        />
                      ) : (
                        <canvas
                          ref={previewCanvasRef}
                          className={styles.previewCanvas}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-white">
          {!isDefaultImage && !success && (
            <Button
              variant="outline-danger"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="me-auto"
            >
              {uploading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                t("Remove")
              )}
            </Button>
          )}

          <Button variant="secondary" onClick={handleModalClose}>
            {t("Cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleImageUpload}
            disabled={
              !selectedFile || !completedCrop || uploading || fileLoading
            }
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t("Uploading...")}
              </>
            ) : (
              t("Upload")
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        /* Make modal backdrop lighter */
        .modal-backdrop {
          opacity: 0.15 !important;
          background-color: rgba(0, 0, 0, 0.2) !important;
        }

        /* Ensure entire modal has white background */
        .modal-content {
          background-color: #ffffff !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
        }

        /* Make modal header bright white with slight shadow for definition */
        .modal-header {
          background-color: #ffffff !important;
          border-bottom: 1px solid #e9ecef !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03) !important;
        }

        /* Ensure modal title is dark for contrast */
        .modal-title {
          color: #333333 !important;
          font-weight: 500 !important;
        }

        /* Light background for footer */
        .modal-footer {
          border-top: 1px solid #e9ecef !important;
          background-color: #f8f9fa !important;
        }

        /* Ensure buttons stand out */
        .modal-footer .btn-primary {
          background-color: #65558f !important;
          border-color: #65558f !important;
          color: white !important;
        }

        .modal-footer .btn-secondary {
          background-color: #6c757d !important;
          border-color: #6c757d !important;
          color: white !important;
        }

        .modal-footer .btn-outline-danger {
          background-color: white !important;
          color: #dc3545 !important;
          border-color: #dc3545 !important;
        }

        /* Make close button in header more visible */
        .modal-header .close {
          color: #000 !important;
          opacity: 0.7 !important;
        }

        .modal-header .close:hover {
          opacity: 1 !important;
        }

        /* Modal body specifically with white background */
        .modal-body {
          background-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

export default ProfilePictureManager;
