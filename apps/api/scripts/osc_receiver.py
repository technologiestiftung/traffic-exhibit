#!/usr/bin/env python3
"""
Simple OSC receiver to test the YOLO detection OSC output.
This script listens for OSC messages from the YOLO detection script from traffic-exhibit-object-detection.
"""

import argparse
from pythonosc import dispatcher
from pythonosc import osc_server

def detected_objects_handler(unused_addr, *args):
    """Handle detected object names"""
    print(f"Detected objects: {list(args)}")

def object_count_handler(unused_addr, count):
    """Handle object count"""
    print(f"Object count: {count}")

def default_handler(unused_addr, *args):
    """Handle any other OSC messages"""
    print(f"Received OSC message at {unused_addr}: {args}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OSC Receiver for YOLO Detection")
    parser.add_argument("--ip", default="127.0.0.1", help="The ip to listen on")
    parser.add_argument("--port", type=int, default=7400, help="The port to listen on")
    parser.add_argument("--address", default="/detected_objects", help="OSC address pattern to listen for")
    
    args = parser.parse_args()
    
    # Create dispatcher and map handlers
    disp = dispatcher.Dispatcher()
    disp.map(args.address + "/names", detected_objects_handler)
    disp.map(args.address + "/count", object_count_handler)
    disp.set_default_handler(default_handler)
    
    # Create and start server
    server = osc_server.BlockingOSCUDPServer((args.ip, args.port), disp)
    print(f"Starting OSC server on {args.ip}:{args.port}")
    print(f"Listening for messages at '{args.address}/*'")
    print("Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down OSC server...")