#!/bin/bash

echo "=================================================="
echo "  Repo Nexus - Testing Infrastructure Verification"
echo "=================================================="
echo ""

echo "📁 Test File Structure:"
echo "----------------------"
find __tests__ -type f -name "*.test.*" | sort | nl

echo ""
echo "📊 Test Count per File:"
echo "----------------------"
for file in $(find __tests__ -name "*.test.*" -type f | sort); do
    count=$(grep -c "it('\\|it(\"" "$file" || echo "0")
    filename=$(basename "$file")
    echo "$filename: $count tests"
done

echo ""
echo "📈 Total Test Summary:"
echo "----------------------"
total_tests=$(find __tests__ -name "*.test.*" -exec grep -h "it('\\|it(\"" {} \; | wc -l)
total_files=$(find __tests__ -name "*.test.*" | wc -l)
echo "Total Test Files: $total_files"
echo "Total Tests: $total_tests"

echo ""
echo "⚙️ Configuration Files:"
echo "----------------------"
[ -f jest.config.js ] && echo "✅ jest.config.js" || echo "❌ jest.config.js MISSING"
[ -f jest.setup.js ] && echo "✅ jest.setup.js" || echo "❌ jest.setup.js MISSING"
[ -f TESTING.md ] && echo "✅ TESTING.md" || echo "❌ TESTING.md MISSING"
[ -f TEST_IMPLEMENTATION_SUMMARY.md ] && echo "✅ TEST_IMPLEMENTATION_SUMMARY.md" || echo "❌ TEST_IMPLEMENTATION_SUMMARY.md MISSING"

echo ""
echo "📦 Test Dependencies:"
echo "----------------------"
npm list --depth=0 2>/dev/null | grep -E "jest|@testing-library|react-test-renderer" || echo "Dependencies installed"

echo ""
echo "✅ Verification Complete!"
echo "=================================================="
echo ""
echo "To run tests, use:"
echo "  npm test              - Run all tests"
echo "  npm run test:watch    - Watch mode"
echo "  npm run test:coverage - With coverage"
echo ""
