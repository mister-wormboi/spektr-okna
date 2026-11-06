#!/usr/bin/env python3
"""Package the supplied variable TTF fonts as lossless WOFF, without dependencies."""
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parent.parent
FONTS = [
    'assets/fonts/Manrope/Manrope-VariableFont_wght.ttf',
    'assets/fonts/Golos_Text/GolosText-VariableFont_wght.ttf',
]


def package(source):
    data = source.read_bytes()
    flavor, count = struct.unpack_from('>IH', data)
    entries, payload = [], bytearray()
    position = 44 + 20 * count
    sfnt_size = 12 + 16 * count
    for index in range(count):
        tag, checksum, offset, length = struct.unpack_from('>4sIII', data, 12 + 16 * index)
        original = data[offset:offset + length]
        compressed = zlib.compress(original, 9)
        chunk = compressed if len(compressed) < length else original
        entries.append(struct.pack('>4sIIII', tag, position, len(chunk), length, checksum))
        padding = (-len(chunk)) % 4
        payload.extend(chunk + b'\0' * padding)
        position += len(chunk) + padding
        sfnt_size += (length + 3) & ~3
    header = struct.pack('>4sIIHHIHHIIIII', b'wOFF', flavor, position, count, 0,
                         sfnt_size, 1, 0, 0, 0, 0, 0, 0)
    output = header + b''.join(entries) + payload
    assert len(output) == position
    # Check every SFNT table, including fvar/gvar: all supplied weights survive.
    for index in range(count):
        tag, offset, compressed_length, length, checksum = struct.unpack_from('>4sIIII', output, 44 + index * 20)
        chunk = output[offset:offset + compressed_length]
        unpacked = zlib.decompress(chunk) if compressed_length < length else chunk
        _, _, original_offset, original_length = struct.unpack_from('>4sIII', data, 12 + index * 16)
        assert unpacked == data[original_offset:original_offset + original_length]
    target = source.with_suffix('.woff')
    target.write_bytes(output)
    print(f'{target.relative_to(ROOT)}: {len(data):,} → {len(output):,} bytes')


if __name__ == '__main__':
    for relative in FONTS:
        package(ROOT / relative)
