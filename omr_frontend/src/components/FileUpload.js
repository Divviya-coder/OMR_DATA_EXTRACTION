import React, { useState } from "react";
import {
  Upload,
  message,
  Card,
  Progress,
  Button,
  Empty,
  Spin,
  Modal,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
// import { useNavigate } from "react-router-dom";

const { Dragger } = Upload;

const FileUpload = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(null);
  // const navigate = useNavigate();

  const handleImageUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Only image files are allowed.");
      return false;
    }

    // if (imageFiles.length >= 100) {
    //   message.error("You can upload up to 100 images only.");
    //   return false;
    // }

    setImageFiles((prevFiles) => [...prevFiles, file]);
    return false; // Prevent automatic upload
  };

  const handleExcelUpload = (file) => {
    const isExcel =
      file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!isExcel) {
      message.error("Only Excel files are allowed.");
      return false;
    }

    setExcelFile(file);
    message.success(`${file.name} uploaded successfully`);
    return false; // Prevent automatic upload
  };

  const handleDeleteImage = (file) => {
    setImageFiles((prevFiles) =>
      prevFiles.filter((item) => item.uid !== file.uid)
    );
    message.info(`${file.name} removed.`);
  };

  const handleDeleteExcel = () => {
    setExcelFile(null);
    message.info("Excel file removed.");
  };

  const handleSubmit = async () => {
    if (!excelFile) {
      message.warning("Please upload an Excel file.");
      return;
    }

    if (imageFiles.length === 0) {
      message.warning("Please upload at least one image.");
      return;
    }

    // Read and process the Excel file
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setProcessing(true);
        setIsModalOpen(true);
        setIsSuccess(null);
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Convert the first sheet to JSON
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Simulate form data submission
        const formData = new FormData();
        console.log(JSON.stringify(jsonData), "JSON.stringify(jsonData)");
        formData.append("excelData", JSON.stringify(jsonData)); // Add JSON data
        imageFiles.forEach((file) => formData.append("images", file));
        // Submit the form data
        const response = await axios.post(
          "http://localhost:3001/upload/images",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200) {
          message.success("Files uploaded successfully.");
          setIsSuccess(true);
          const data = response.data.finaloutput;

          // Prepare data for Excel
          const rows = data.map((item) => ({
            "Candidate ID": item.candidateid,
            "Candidate Name": item.candidatename,
            "Birthday": `${item.birthday}-${item.birthmonth}-${item.birthyear}`,
            "Mobile Number": item.mobilenumber,
            "Attended Questions": item.attendedQuestions,
            "Total Correct": item.totalCorrect,
            "Total Wrong": item.totalWrong,
            "Total Left": item.totalLeft,
            "Total Mark": item.totalMark,
            "Percentage": item.percentage,
            "Rank": item.rank,
            ...item.answers, // Include answers as columns (e.g., q1, q2, ..., q100)
          }));
          setImageFiles([])
          // Create a worksheet
          const worksheet = XLSX.utils.json_to_sheet(rows);

          // Create a workbook and append the worksheet
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

          // Write the workbook and trigger the download
          const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
          });
          const blob = new Blob([excelBuffer], {
            type: "application/octet-stream",
          });
          saveAs(blob, "CandidatesResults.xlsx");

          // const navigateData = {
          //   jsonData,
          //   images: imageFiles.map((file) => URL.createObjectURL(file)), // Local preview URLs for navigation
          //   };
          //   navigate("/success", { state: navigateData });
        }
        // Navigate to the success page with JSON data and images

        // console.log(navigateData);
      } catch (error) {
        message.error("Failed to upload files. Please try again.");
        setIsSuccess(false);
      } finally {
        setLoading(false); // Stop loading
        setProcessing(false); // Stop loading after the API call completes
      }
    };

    reader.readAsArrayBuffer(excelFile);
  };
  // const handleSubmit1 = async () => {
  //   // if (!excelFile) {
  //   //   message.warning("Please upload an Excel file.");
  //   //   return;
  //   // }

  //   if (imageFiles.length === 0) {
  //     message.warning("Please upload at least one image.");
  //     return;
  //   }

  //   try {
  //     setProcessing(true);
  //     setIsModalOpen(true);
  //     setIsSuccess(null);
  //     // setLoading(true);
  //     // Create a FormData instance
  //     let formData = new FormData();

  //     // Append Excel file
  //     // formData.append("excelFile", excelFile);

  //     // Append images
  //     imageFiles.forEach((file) => {
  //       formData.append("images", file); // Assuming files are from browser input
  //     });

  //     // Axios configuration
  //     const config = {
  //       method: "post",
  //       maxBodyLength: Infinity,
  //       url: "http://localhost:3001/upload/images",
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         ...formData.getHeaders?.(), // Use `.getHeaders()` if running in Node.js
  //       },
  //       data: formData,
  //     };

  //     // Make the Axios request
  //     const response = await axios.request(config);

  //     // Handle the response
  //     if (response.status === 200) {
  //       message.success("Files uploaded successfully.");
  //       console.log("Server Response:", JSON.stringify(response.data));
  //       setIsSuccess(true);
  //     }
  //   } catch (error) {
  //     console.error("Error during file upload:", error);
  //     message.error("Failed to upload files. Please try again.");
  //     setIsSuccess(false);
  //   } finally {
  //     setLoading(false); // Stop loading
  //     setProcessing(false); // Stop loading after the API call completes
  //   }
  // };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsSuccess(null);
    setProcessing(false); // Close the modal
  };

  return (
    <div>
      <div
        style={{
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3>Upload Excel File</h3>
        <Dragger
          beforeUpload={handleExcelUpload}
          fileList={[]} // Prevent Ant Design from managing the file list
          style={{
            padding: "20px",
            width: "57vw",
            border: "1px dashed #d9d9d9",
            backgroundColor: "#fafafa",
          }}
        >
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined style={{ fontSize: 24, color: "#52c41a" }} />
          </p>
          <p className="ant-upload-text">
            Drag and drop an Excel file here or click to upload
          </p>
          <p className="ant-upload-hint">Only Excel files are supported.</p>
        </Dragger>
        {excelFile && (
          <Card
            style={{ marginTop: 20, width: 300 }}
            actions={[
              <DeleteOutlined key="delete" onClick={handleDeleteExcel} />,
            ]}
          >
            <Card.Meta
              title={excelFile.name}
              description="Excel file uploaded successfully."
            />
          </Card>
        )}

        <h3 style={{ marginTop: 40 }}>Upload Images</h3>
        <Dragger
          beforeUpload={(file) => {
            const result = handleImageUpload(file);
            // showUploadMessage(imageFiles);
            return result;
          }}
          multiple
          fileList={[]} // Prevent Ant Design from managing the file list
          style={{
            padding: "20px",
            width: "57vw",
            border: "1px dashed #d9d9d9",
            backgroundColor: "#fafafa",
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 24, color: "#1890ff" }} />
          </p>
          <p className="ant-upload-text">
            Drag and drop images here or click to upload
          </p>
          <p className="ant-upload-hint">Supports image files only.</p>
        </Dragger>
        {/* <Progress
            percent={imageFiles.length}
            status="active"
            style={{ marginTop: 10, width: "400px" }}
          /> */}
        <p>Uploaded Images: {imageFiles.length}</p>

        <div
          style={{
            marginTop: 20,
            height: "200px",
            overflowY: "auto",
            width: "100%",
            maxWidth: "57vw",
            border: "1px solid #d9d9d9",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)", // 5 items per row
            gap: "10px",
            borderRadius: "8px",
          }}
        >
          {imageFiles?.length == 0 ? (
            <div
              style={{
                width: "530px",
                // border: "1px solid red",
                display: "flex",
                justifyContent: "end",
              }}
            >
              <Empty />
            </div>
          ) : (
            imageFiles?.map((file) => (
              <div
                key={file.uid}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  border: "1px solid #d9d9d9",
                  padding: "5px",
                  borderRadius: "5px",
                  backgroundColor: "#fff",
                }}
              >
                <img
                  alt={file.name}
                  src={URL.createObjectURL(file)}
                  style={{
                    width: "120px", // Smaller image size
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "5px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "8px",
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteImage(file)}
                  style={{
                    marginTop: "5px",
                    fontSize: "12px",
                    color: "#ff4d4f",
                  }}
                ></Button>
              </div>
            ))
          )}
        </div>
        {/* <div
        style={{
          marginTop: 20,
          height: "200px",
          overflowY: "auto",
          width: "100%",
          maxWidth: "57vw",
          border: "1px solid #d9d9d9",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)", // 5 items per row
          gap: "10px",
          borderRadius: "8px",
        }}
      >
        {imageFiles.map((file) => (
          <div
            key={file.uid}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: "1px solid #d9d9d9",
              padding: "5px",
              borderRadius: "5px",
              backgroundColor: "#fff",
            }}
          >
            <img
              alt={file.name}
              src={URL.createObjectURL(file)}
              style={{
                width: "120px", // Adjusted image size
                height: "60px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid #d9d9d9",
              }}
            />
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteImage(file)}
              style={{
                marginTop: "5px",
                fontSize: "12px",
                color: "#ff4d4f",
              }}
            ></Button>
          </div>
        ))}
      </div> */}

        {/* Clear All Button */}
        <Button
          type="primary"
          danger
          onClick={() => setImageFiles([])} // Clears all images
          style={{
            marginTop: "10px",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
          disabled={imageFiles.length === 0} // Disable if no images
        >
          Clear All
        </Button>

        <Button
          type="primary"
          style={{ marginTop: 40, width: "200px" }}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
      <Modal
        open={isModalOpen}
        footer={null} // Remove default footer
        closable={!processing} // Allow closing unless processing
        maskClosable={!processing} // Prevent outside click to close while processing
        onCancel={handleModalClose} // Handle close when "X" is clicked
        title="File Upload Status"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "20px",
          }}
        >
          {processing ? (
            <>
              <Spin
                size="large"
              // indicator={
              //   <LoadingOutlined
              //     style={{ fontSize: 48, color: "#1890ff" }}
              //     spin
              //   />
              // }
              />
              <p
                style={{
                  marginTop: "50px",
                  fontSize: "16px",
                  color: "#1890ff",
                }}
              >
                Processing upload, please wait...
              </p>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircleOutlined
                style={{ fontSize: 48, color: "#52c41a", marginBottom: "20px" }}
              />
              <p style={{ fontSize: "16px" }}>Upload completed successfully!</p>
              <Button
                type="primary"
                onClick={handleModalClose}
                style={{ marginTop: "20px" }}
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <CloseCircleOutlined
                style={{ fontSize: 48, color: "#ff4d4f", marginBottom: "20px" }}
              />
              <p style={{ fontSize: "16px", color: "#ff4d4f" }}>
                Upload failed. Please try again.
              </p>
              <Button
                type="primary"
                onClick={handleModalClose}
                style={{ marginTop: "20px" }}
              >
                Close
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FileUpload;
