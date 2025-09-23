import pytest
from .provider import SafetyAdvisor


class TestSafetyAdvisor:
    """Test cases for SafetyAdvisor provider."""

    def setup_method(self):
        """Set up test fixtures."""
        self.advisor = SafetyAdvisor()

    def test_get_instructions_returns_required_keys(self):
        """Test that get_instructions returns all required keys."""
        result = self.advisor.get_instructions("MISSILE", 120)

        required_keys = {'title', 'steps', 'do_not', 'eta_hint'}
        assert set(result.keys()) == required_keys

    def test_get_instructions_all_hazard_types(self):
        """Test get_instructions for all supported hazard types."""
        hazard_types = ['AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL']

        for hazard_type in hazard_types:
            result = self.advisor.get_instructions(hazard_type, 300)

            # Check all required keys exist
            assert 'title' in result
            assert 'steps' in result
            assert 'do_not' in result
            assert 'eta_hint' in result

            # Check non-empty values
            assert result['title']  # Non-empty string
            assert len(result['steps']) > 0  # Non-empty list
            assert len(result['do_not']) > 0  # Non-empty list
            assert result['eta_hint']  # Non-empty string

    def test_get_instructions_missile_content(self):
        """Test specific content for MISSILE hazard type."""
        result = self.advisor.get_instructions("MISSILE", 80)

        assert "Nadlatujący pocisk" in result['title']
        assert "Natychmiast upadnij na ziemię" in result['steps'][0]
        assert "Nie biegnij po otwartych przestrzeniach" in result['do_not'][0]
        assert "1 minut" in result['eta_hint']  # 80 seconds = 1 minute

    def test_get_instructions_air_raid_content(self):
        """Test specific content for AIR_RAID hazard type."""
        result = self.advisor.get_instructions("AIR_RAID", 300)

        assert "Alert lotniczy" in result['title']
        assert "Porzuć wszystko" in result['steps'][0]
        assert "Nie używaj wind" in result['do_not'][0]
        assert "5 minut" in result['eta_hint']  # 300 seconds = 5 minutes

    def test_get_instructions_eta_hint_conversion(self):
        """Test ETA hint time conversion."""
        # Test seconds (45 seconds = 0 minutes in integer division)
        result = self.advisor.get_instructions("MISSILE", 45)
        assert "0 minut" in result['eta_hint']

        # Test minutes
        result = self.advisor.get_instructions("MISSILE", 180)
        assert "3 minut" in result['eta_hint']

        # Test large time (65 minutes)
        result = self.advisor.get_instructions("MISSILE", 3900)  # 65 minutes
        assert "65 minut" in result['eta_hint']

    def test_get_instructions_unknown_hazard_type(self):
        """Test fallback for unknown hazard types."""
        result = self.advisor.get_instructions("UNKNOWN_HAZARD", 120)

        assert result['title'] == "Alert alarmowy - Szukaj bezpieczeństwa"
        assert len(result['steps']) > 0
        assert len(result['do_not']) > 0
        assert "2 minut" in result['eta_hint']

    def test_get_instructions_zero_eta(self):
        """Test with zero ETA seconds."""
        result = self.advisor.get_instructions("MISSILE", 0)
        assert "0 minut" in result['eta_hint']

    def test_get_instructions_steps_not_empty(self):
        """Test that all hazard types have non-empty steps."""
        hazard_types = ['AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL']

        for hazard_type in hazard_types:
            result = self.advisor.get_instructions(hazard_type, 120)

            # All steps should be non-empty strings
            for step in result['steps']:
                assert isinstance(step, str)
                assert len(step.strip()) > 0

            # All do_not items should be non-empty strings
            for item in result['do_not']:
                assert isinstance(item, str)
                assert len(item.strip()) > 0

    def test_get_instructions_unique_content(self):
        """Test that different hazard types have unique content."""
        missile_result = self.advisor.get_instructions("MISSILE", 120)
        flood_result = self.advisor.get_instructions("FLOOD", 120)
        fire_result = self.advisor.get_instructions("FIRE", 120)

        # Titles should be different
        assert missile_result['title'] != flood_result['title']
        assert missile_result['title'] != fire_result['title']
        assert flood_result['title'] != fire_result['title']

        # At least some steps should be different
        assert missile_result['steps'] != flood_result['steps']
        assert missile_result['steps'] != fire_result['steps']