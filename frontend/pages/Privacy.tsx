import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="px-6 py-8 text-gray-800 dark:text-gray-100 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Chính sách bảo mật</h1>
      <p className="mb-3">
        NDhubs AI tôn trọng quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi thu thập,
        sử dụng và bảo vệ dữ liệu cá nhân khi bạn sử dụng sản phẩm và dịch vụ của chúng tôi.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Dữ liệu chúng tôi thu thập</h2>
      <ul className="list-disc pl-6 mb-3">
        <li>Thông tin tài khoản: email, tên hiển thị, ảnh đại diện (nếu có).</li>
        <li>Nội dung bạn tạo: văn bản, hình ảnh, video do bạn tải lên hoặc tạo bằng AI.</li>
        <li>Dữ liệu kỹ thuật: cookie, địa chỉ IP, loại trình duyệt, thời gian truy cập.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Mục đích sử dụng dữ liệu</h2>
      <ul className="list-disc pl-6 mb-3">
        <li>Cung cấp và cải thiện tính năng tạo nội dung bằng AI.</li>
        <li>Hỗ trợ khách hàng, xử lý yêu cầu và phản hồi.</li>
        <li>Phân tích sử dụng để tối ưu hóa hiệu năng và trải nghiệm.</li>
        <li>Tuân thủ nghĩa vụ pháp lý và chính sách platform.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Cookies và công nghệ theo dõi</h2>
      <p className="mb-3">
        Chúng tôi sử dụng cookies cho xác thực phiên, phân tích lưu lượng (Google Analytics), và hiển thị quảng cáo
        (Google AdSense). Bạn có thể quản lý cookies trong trình duyệt; tuy nhiên việc tắt cookies có thể
        ảnh hưởng một số chức năng.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Chia sẻ dữ liệu</h2>
      <p className="mb-3">
        Chúng tôi không bán dữ liệu cá nhân. Dữ liệu có thể được chia sẻ với các nhà cung cấp dịch vụ xử lý
        (ví dụ: hạ tầng AI, lưu trữ, thanh toán) theo hợp đồng, nhằm cung cấp dịch vụ cho bạn, và với cơ quan
        có thẩm quyền khi được yêu cầu theo luật.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Bảo mật</h2>
      <p className="mb-3">
        Chúng tôi áp dụng các biện pháp phù hợp để bảo vệ dữ liệu, bao gồm kiểm soát truy cập, mã hóa truyền tải
        và giám sát hệ thống. Dù vậy, không hệ thống nào an toàn tuyệt đối, bạn vui lòng bảo quản thông tin đăng nhập.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Quyền của bạn</h2>
      <ul className="list-disc pl-6 mb-3">
        <li>Yêu cầu truy cập, chỉnh sửa, xóa dữ liệu cá nhân.</li>
        <li>Rút lại đồng ý xử lý dữ liệu (nếu áp dụng).</li>
        <li>Liên hệ để được hỗ trợ tại trang Liên hệ.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Liên hệ</h2>
      <p className="mb-3">
        Nếu bạn có câu hỏi về Chính sách bảo mật, vui lòng liên hệ qua trang <a href="/contact" className="text-blue-600">Liên hệ</a>.
      </p>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">Cập nhật gần đây: %BUILD_DATE%</p>
    </div>
  );
};

export default Privacy;

