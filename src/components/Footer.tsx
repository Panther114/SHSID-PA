export default function Footer() {
  return (
    <footer>
      <div>2026 SHSID PA</div>
      <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', opacity: 0.7 }}>Site by Gavin Yu</div>
      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', opacity: 0.7 }}>
        Guides are licensed under{' '}
        <a
          href="https://creativecommons.org/licenses/by-nc/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          CC BY-NC 4.0
        </a>
        {' '}— you may share and adapt them for non-commercial purposes with attribution.
        The site code is licensed under the{' '}
        <a
          href="https://opensource.org/licenses/MIT"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          MIT License
        </a>
        {' '}— permission is granted free of charge to use, copy, modify, merge, publish,
        distribute, sublicense, and/or sell copies of the software, subject to the MIT license terms.
      </div>
    </footer>
  );
}
