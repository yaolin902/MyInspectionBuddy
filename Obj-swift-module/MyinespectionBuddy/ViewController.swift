import UIKit
import AVFoundation
import Vision
import CoreML
import SwiftUI
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
class ViewController: UIViewController, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    private var permissionGranted = false // Flag for permission
    private let captureSession = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "sessionQueue")
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var imageView = UIImageView()
    private var takePictureButton = UIButton(type: .system)
    private var selectPhotoButton = UIButton(type: .system)
    private var confirmButton = UIButton(type: .system)
    private var returnButton = UIButton(type: .system)
    private let imagePicker = UIImagePickerController()
    private var screenRect: CGRect! = nil // For view dimensions
    private var selectedImage: UIImage?
    private var boundingBoxView = DrawingBoundingBoxView()


    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        checkPermission()
    }

    private func setupUI() {
        
        // Configure the UIImageView
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        view.addSubview(imageView)
        
        // Configure the DrawingBoundingBoxView
        boundingBoxView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(boundingBoxView)
        
        NSLayoutConstraint.activate([
            imageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            imageView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            imageView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.9),
            imageView.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.6),
            
            boundingBoxView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            boundingBoxView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            boundingBoxView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.9),
            boundingBoxView.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.6)
        ])
        
        // Configure the take picture button
        takePictureButton.setTitle("Take Picture", for: .normal)
        takePictureButton.setTitleColor(.white, for: .normal) // Set title color
        takePictureButton.backgroundColor = .systemBlue // Set background color
        takePictureButton.layer.cornerRadius = 10 // Set corner radius
        takePictureButton.addTarget(self, action: #selector(takePicture), for: .touchUpInside)
        takePictureButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(takePictureButton)
        
        // Configure the select photo button
        selectPhotoButton.setTitle("Select Photo", for: .normal)
        selectPhotoButton.setTitleColor(.white, for: .normal) // Set title color
        selectPhotoButton.backgroundColor = .systemBlue // Set background color
        selectPhotoButton.layer.cornerRadius = 10 // Set corner radius
        selectPhotoButton.addTarget(self, action: #selector(selectPhoto), for: .touchUpInside)
        selectPhotoButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(selectPhotoButton)
        
        // Configure the confirm button
        confirmButton.configuration = .gray()
        confirmButton.configuration?.image=UIImage(systemName: "paperplane.fill")
        confirmButton.configuration?.title = "Confirm"
        confirmButton.configuration?.baseForegroundColor = .white
        confirmButton.configuration?.baseBackgroundColor = .systemBlue
        confirmButton.layer.cornerRadius = 10
        confirmButton.translatesAutoresizingMaskIntoConstraints = false
        confirmButton.addTarget(self, action: #selector(confirmPhoto), for: .touchUpInside)
        confirmButton.isHidden = true
        view.addSubview(confirmButton)
        
        returnButton.layer.cornerRadius = 15
        returnButton.configuration?.image=UIImage(systemName: "return")
            returnButton.backgroundColor = .systemRed
            returnButton.addTarget(self, action: #selector(returnToMain), for: .touchUpInside)
            returnButton.translatesAutoresizingMaskIntoConstraints = false
            returnButton.isHidden = true
            view.addSubview(returnButton)
        
        
        
        NSLayoutConstraint.activate([
            takePictureButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            takePictureButton.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -40),
            takePictureButton.widthAnchor.constraint(equalToConstant: 200),
            takePictureButton.heightAnchor.constraint(equalToConstant: 50),
            
            selectPhotoButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            selectPhotoButton.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: 40),
            selectPhotoButton.widthAnchor.constraint(equalToConstant: 200),
            selectPhotoButton.heightAnchor.constraint(equalToConstant: 50),
            
            confirmButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
                        
            confirmButton.bottomAnchor.constraint(equalTo:view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            confirmButton.widthAnchor.constraint(equalToConstant: 200),
            confirmButton.heightAnchor.constraint(equalToConstant: 50),
            
            returnButton.leadingAnchor.constraint(equalTo: confirmButton.trailingAnchor, constant: 10), // Position next to the confirm button
                    returnButton.centerYAnchor.constraint(equalTo: confirmButton.centerYAnchor),
                    returnButton.widthAnchor.constraint(equalToConstant: 30),
                    returnButton.heightAnchor.constraint(equalToConstant: 30)
        ])
        
    }
    @objc private func confirmPhoto() {
        guard let image = selectedImage else { return }
        
        // Show the activity indicator
        
        
        processImageWithCoreML(image: image)
        
        returnButton.isHidden = false // Show the return button
    }

    @objc private func takePicture() {
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            imagePicker.delegate = self
            imagePicker.sourceType = .camera
            present(imagePicker, animated: true, completion: nil)
        } else {
            showCameraUnavailableAlert()
        }
    }

    @objc private func selectPhoto() {
        if UIImagePickerController.isSourceTypeAvailable(.photoLibrary) {
            imagePicker.delegate = self
            imagePicker.sourceType = .photoLibrary
            present(imagePicker, animated: true, completion: nil)
        } else {
            showPhotoLibraryUnavailableAlert()
        }
        UIView.animate(withDuration: 0.5) {
                   self.takePictureButton.alpha = 0.0
                   self.selectPhotoButton.alpha = 0.0
               }
    }

  
    @objc private func returnToMain() {
        // Reset the UI elements to their initial state
        UIView.animate(withDuration: 0.5) {
            self.takePictureButton.alpha = 1.0
            self.selectPhotoButton.alpha = 1.0
            self.takePictureButton.isHidden = false
            self.selectPhotoButton.isHidden = false
            
            self.confirmButton.isHidden = true
            self.returnButton.isHidden = true
            self.imageView.image = nil
            self.boundingBoxView.predictedObjects = [] // Clear the bounding boxes
            self.boundingBoxView.isHidden = true // Hide the bounding box view
        } completion: { _ in
            // Additional reset logic if needed
        }
    }
    

    private func checkPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            permissionGranted = true
        case .notDetermined:
            requestPermission()
        case .denied, .restricted:
            permissionGranted = false
            showPermissionDeniedAlert()
        @unknown default:
            fatalError("Unknown authorization status")
        }
    }

    private func requestPermission() {
        sessionQueue.suspend()
        AVCaptureDevice.requestAccess(for: .video) { granted in
            self.permissionGranted = granted
            if !granted {
                DispatchQueue.main.async {
                    self.showPermissionDeniedAlert()
                }
            }
            self.sessionQueue.resume()
        }
    }

    private func showPermissionDeniedAlert() {
        let alert = UIAlertController(title: "Camera Access Denied",
                                      message: "Please enable camera access in Settings.",
                                      preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }

    private func showCameraUnavailableAlert() {
        let alert = UIAlertController(title: "Camera Unavailable",
                                      message: "The camera is not available on this device.",
                                      preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }
    
    private func showPhotoLibraryUnavailableAlert() {
        let alert = UIAlertController(title: "Photo Library Unavailable",
                                      message: "The photo library is not available on this device.",
                                      preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        if let pickedImage = info[.originalImage] as? UIImage {
            selectedImage = pickedImage
            imageView.image = pickedImage
            boundingBoxView.isHidden = true // Hide bounding box view initially
            confirmButton.isHidden = false // Show confirm button
            
            // If the image was taken from the camera, save it to the photo library
            if picker.sourceType == .camera {
                UIImageWriteToSavedPhotosAlbum(pickedImage, self, #selector(image(_:didFinishSavingWithError:contextInfo:)), nil)
            }

            // Animate the hiding of the buttons
            UIView.animate(withDuration: 0.5) {
                self.takePictureButton.alpha = 0.0
                self.selectPhotoButton.alpha = 0.0
            } completion: { _ in
                self.takePictureButton.isHidden = true
                self.selectPhotoButton.isHidden = true
            }
        }
        picker.dismiss(animated: true, completion: nil)
    }

    // Callback method after image is saved to the library
    @objc private func image(_ image: UIImage, didFinishSavingWithError error: Error?, contextInfo: UnsafeRawPointer) {
        if let error = error {
            // Show an error message if the save failed
            let alert = UIAlertController(title: "Save error", message: error.localizedDescription, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
        } else {
            // Optionally, show a success message if the save succeeded
            let alert = UIAlertController(title: "Saved!", message: "Your image has been saved to your photos.", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
        }
    }


    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true, completion: nil)
        
        // Make sure the buttons are visible again
        UIView.animate(withDuration: 0.5) {
            self.takePictureButton.alpha = 1.0
            self.selectPhotoButton.alpha = 1.0
        }
    }


    // Process the image with Core ML
    private func processImageWithCoreML(image: UIImage) {
        guard let modelURL = Bundle.main.url(forResource: "/MyObjectDetector 1", withExtension: "mlmodelc"),
              let model = try? MLModel(contentsOf: modelURL),
              let visionModel = try? VNCoreMLModel(for: model) else {
            fatalError("Failed to load model")
        }

        let handler = VNImageRequestHandler(cgImage: image.cgImage!, options: [:])
        let request = VNCoreMLRequest(model: visionModel) { (request, error) in
            guard let results = request.results as? [VNRecognizedObjectObservation] else {
                return
            }
            DispatchQueue.main.async {
                self.displayResults(results, on: image)
            }
        }
        
        try? handler.perform([request])
    }

    private func displayResults(_ results: [VNRecognizedObjectObservation], on image: UIImage) {
        boundingBoxView.predictedObjects = results
        boundingBoxView.isHidden = false // Show bounding box view
    }
}

class DrawingBoundingBoxView: UIView {

    // Static dictionary to store label colors
    static private var colors: [String: UIColor] = [:]
    
    // Layer reuse pool to improve performance
    private var layerPool = [CAShapeLayer]()
    
    // Array of predicted objects to be drawn, triggers drawing when set
    public var predictedObjects: [VNRecognizedObjectObservation] = [] {
        didSet {
            drawBoundingBoxes(with: predictedObjects)
        }
    }

    // Method to get a color for a label, assigning a random color if not already assigned
    private func labelColor(for label: String) -> UIColor {
        if let color = DrawingBoundingBoxView.colors[label] {
            return color
        } else {
            let color = UIColor(hue: .random(in: 0...1), saturation: 1, brightness: 1, alpha: 0.8)
            DrawingBoundingBoxView.colors[label] = color
            return color
        }
    }

    // Method to draw bounding boxes based on predictions
    private func drawBoundingBoxes(with predictions: [VNRecognizedObjectObservation]) {
        let existingLayers = layer.sublayers?.compactMap { $0 as? CAShapeLayer } ?? []
        
        // Remove extra layers if predictions are less than current layers
        if existingLayers.count > predictions.count {
            for i in predictions.count..<existingLayers.count {
                existingLayers[i].removeFromSuperlayer()
            }
        }
        
        // Iterate through the predictions and update or create layers
        for (i, prediction) in predictions.enumerated() {
            let transformedBounds = transformBoundingBox(prediction.boundingBox)
            let label = prediction.label ?? "N/A"
            let confidence = prediction.confidence
            
            let boxLayer: CALayer
            if i < existingLayers.count {
                boxLayer = existingLayers[i]
            } else {
                boxLayer = drawBox()
                layer.addSublayer(boxLayer)
            }
            
            boxLayer.frame = transformedBounds
            boxLayer.borderColor = labelColor(for: label).cgColor
            
            // Update or add label
            if let textLayer = boxLayer.sublayers?.first as? CATextLayer {
                updateLabel(textLayer, with: label, confidence: confidence, color: labelColor(for: label))
            } else {
                addLabel(to: boxLayer, with: label, color: labelColor(for: label))
            }
        }
    }

    // Transform the bounding box to match the view's size and orientation
    private func transformBoundingBox(_ boundingBox: CGRect) -> CGRect {
        let scale = CGAffineTransform.identity.scaledBy(x: bounds.width, y: bounds.height)
        let transform = CGAffineTransform(scaleX: 1, y: -1).translatedBy(x: 0, y: -1)
        let correctedBoundingBox = boundingBox.applying(transform).applying(scale)
        
        return correctedBoundingBox
    }

    // Method to create a CAShapeLayer for a bounding box
    private func drawBox() -> CALayer {
        let boxLayer = CALayer()
        boxLayer.borderWidth = 2.0
        boxLayer.cornerRadius = 4.0
        boxLayer.backgroundColor = UIColor.clear.cgColor
        return boxLayer
    }

    // Method to update an existing label layer
    private func updateLabel(_ textLayer: CATextLayer, with text: String, confidence: VNConfidence, color: UIColor) {
        let formattedText = "\(text) (\(Int(confidence * 100))%)"
        textLayer.string = formattedText
        textLayer.backgroundColor = color.cgColor
    }

    // Method to add a label above the bounding box
    private func addLabel(to boxLayer: CALayer, with text: String, color: UIColor) {
        let label = CATextLayer()
        
        label.string = "gas cylinder" // Only show the category text
        label.fontSize = 12
        label.foregroundColor = UIColor.black.cgColor
        label.backgroundColor = color.cgColor
        label.alignmentMode = .center
        label.contentsScale = UIScreen.main.scale
        
        let textHeight: CGFloat = 16
        let textRect = CGRect(x: 0, y: -textHeight, width: boxLayer.bounds.width, height: textHeight)
        label.frame = textRect
        
        boxLayer.addSublayer(label)
    }

}
// Extension to provide easy access to the label identifier from VNRecognizedObjectObservation
extension VNRecognizedObjectObservation {
    var label: String? {
        return self.labels.first?.identifier
    }
    

}





struct ContentView: View {
    var body: some View {
        UIViewControllerWrapper()
            .edgesIgnoringSafeArea(.all)
    }
}

struct UIViewControllerWrapper: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> ViewController {
        return ViewController()
    }

    func updateUIViewController(_ uiViewController: ViewController, context: Context) {}
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}





