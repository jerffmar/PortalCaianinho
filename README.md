# portal-caianinho

This project is a simple web application that demonstrates how to serve static files using Nginx in a Docker container. It includes an HTML file and a JavaScript file to provide interactivity.

## Project Structure

```
portal-caianinho
├── src
│   ├── index.html       # Main HTML file
│   └── script.js        # JavaScript file for interactivity
├── Dockerfile           # Dockerfile to build the image
├── nginx.conf           # Nginx configuration file
└── README.md            # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd mportal-caianinho
   ```

2. **Build the Docker image:**
   ```
   docker build -t portal-caianinho .
   ```

3. **Run the Docker container:**
   ```
   docker run -d -p 80:80 portal-caianinho
   ```

4. **Access the application:**
   Open your web browser and go to `http://localhost`.

## Usage

- The `index.html` file serves as the main entry point for the application.
- The `script.js` file contains JavaScript code that adds interactivity to the web page.

## License

This project is licensed under the MIT License.