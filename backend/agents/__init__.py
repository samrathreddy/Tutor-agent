"""
Agents package for the Multi-Agent Tutoring Bot.
This package contains the implementation of the main Tutor Agent
and various specialist agents.
"""

from .tutor_agent import TutorAgent
from .math_agent import MathAgent
from .physics_agent import PhysicsAgent

__all__ = ['TutorAgent', 'MathAgent', 'PhysicsAgent'] 