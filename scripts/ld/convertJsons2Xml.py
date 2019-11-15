import sys
import urllib
import json
import argparse
import urllib.request
from rdflib import URIRef, BNode, Literal, Graph
import time
import os
import requests
import glob

files = glob.glob("tmp/*.json")

for file in files:

    print(file)